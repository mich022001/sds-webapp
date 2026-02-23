import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const app = express();
app.use(express.json());

// For now allow all origins (we will tighten after Vercel URL exists)
app.use(cors({ origin: true }));

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL env var");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // needed on many hosted postgres providers
});

function nowPH() {
  // similar output to your nowPH: yyyy/MM/dd HH:mm:ss in Asia/Shanghai
  const d = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  }).format(d); // "YYYY-MM-DD HH:mm:ss"
  return parts.replaceAll("-", "/");
}

async function q(sql, params = []) {
  return pool.query(sql, params);
}

async function getNextMemberId() {
  const PREFIX = "2026EM";
  const PAD = 6;

  const r = await q(`select member_id from members order by id desc limit 1`);
  if (r.rowCount === 0) return PREFIX + "000001";

  const lastId = r.rows[0].member_id;
  if (!lastId.startsWith(PREFIX)) throw new Error("Last Member ID format is invalid.");

  const lastNumber = Number(lastId.slice(PREFIX.length));
  if (Number.isNaN(lastNumber)) throw new Error("Last Member ID number is invalid.");

  const next = lastNumber + 1;
  return PREFIX + String(next).padStart(PAD, "0");
}

async function rebuildMemberBonusSummary(memberName) {
  const total = await q(
    `select
      coalesce(sum(case when bonus_type='Cash' then coalesce(amount_num,0) else 0 end),0) as total_cash,
      coalesce(sum(case when bonus_type='Product' then coalesce(amount_num,0) else 0 end),0) as total_product
     from bonus_ledger
     where earner_name=$1`,
    [memberName]
  );

  const redeemed = await q(
    `select
      coalesce(sum(case when redeem_type='Cash' then qty else 0 end),0) as redeemed_cash,
      coalesce(sum(case when redeem_type='Product' then qty else 0 end),0) as redeemed_product
     from redemptions
     where member_name=$1`,
    [memberName]
  );

  const member = await q(`select member_id, membership_type from members where name=$1`, [memberName]);

  const totalCash = Number(total.rows[0].total_cash);
  const totalProduct = Number(total.rows[0].total_product);
  const redeemedCash = Number(redeemed.rows[0].redeemed_cash);
  const redeemedProduct = Number(redeemed.rows[0].redeemed_product);

  const balanceCash = totalCash - redeemedCash;
  const balanceProduct = totalProduct - redeemedProduct;

  const memberId = member.rowCount ? member.rows[0].member_id : "";
  const membershipType = member.rowCount ? member.rows[0].membership_type : "";

  await q(
    `insert into member_bonus_summary
      (member_name, member_id, membership_type, total_cash, total_product, redeemed_cash, redeemed_product, balance_cash, balance_product, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (member_name) do update set
      member_id=excluded.member_id,
      membership_type=excluded.membership_type,
      total_cash=excluded.total_cash,
      total_product=excluded.total_product,
      redeemed_cash=excluded.redeemed_cash,
      redeemed_product=excluded.redeemed_product,
      balance_cash=excluded.balance_cash,
      balance_product=excluded.balance_product,
      updated_at=excluded.updated_at`,
    [
      memberName, memberId, membershipType,
      totalCash, totalProduct, redeemedCash, redeemedProduct,
      balanceCash, balanceProduct,
      new Date().toISOString()
    ]
  );
}

async function promoteSponsorIfEligible(sponsorName) {
  if (!sponsorName) return;
  const r = await q(`select membership_type from members where name=$1`, [sponsorName]);
  if (!r.rowCount) return;
  if (r.rows[0].membership_type === "Member") {
    await q(`update members set membership_type='Distributor' where name=$1`, [sponsorName]);
  }
}

async function getFirstLevelUpline(memberName) {
  let r = await q(`select name, sponsor_name, level from members where name=$1`, [memberName]);
  if (!r.rowCount) return null;
  let cur = r.rows[0];

  while (Number(cur.level) !== 1) {
    if (!cur.sponsor_name) return null;
    r = await q(`select name, sponsor_name, level from members where name=$1`, [cur.sponsor_name]);
    if (!r.rowCount) return null;
    cur = r.rows[0];
  }
  return cur.name;
}

/** =========================
 *  REGISTRATION (saveMember)
 *  ========================= */
app.post("/api/registration", async (req, res) => {
  try {
    const now = nowPH();
    const { name, contact, email, membershipType, address, sponsor, areaRegion } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });

    // duplicate by name
    const dup = await q(`select 1 from members where lower(name)=lower($1)`, [name.trim()]);
    if (dup.rowCount) return res.status(400).json({ error: "This member is already registered." });

    // sponsor lookup (unless SDS)
    let sponsorRow = null;
    if (sponsor && sponsor.toUpperCase() !== "SDS") {
      const s = await q(`select * from members where lower(name)=lower($1)`, [sponsor.trim()]);
      if (!s.rowCount) return res.status(400).json({ error: "Sponsor not found." });
      sponsorRow = s.rows[0];
    }

    const level = sponsorRow ? Number(sponsorRow.level) + 1 : 0;

    // regional manager assignment
    let regionalManager = "";
    if (membershipType === "Regional Manager") regionalManager = name.trim();
    else if (sponsorRow) {
      regionalManager = (sponsorRow.membership_type === "Regional Manager")
        ? sponsorRow.name
        : (sponsorRow.regional_manager || "");
    }

    const memberId = await getNextMemberId();

    await q(
      `insert into members
        (name, member_id, contact, email, membership_type, level, address, sponsor_name, regional_manager, area_region, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        name.trim(),
        memberId,
        contact || "",
        email || "",
        membershipType || "Member",
        level,
        address || "",
        sponsorRow ? sponsorRow.name : (sponsor || ""),
        regionalManager,
        areaRegion || "",
        now
      ]
    );

    // always update summary for new member
    await rebuildMemberBonusSummary(name.trim());

    // promote sponsor if eligible
    if (sponsorRow) await promoteSponsorIfEligible(sponsorRow.name);

    // upline walk up to 7
    let currentSponsor = sponsorRow;
    let relativeLevel = 1;

    while (currentSponsor && relativeLevel <= 7) {
      let bonusType = "";
      let amountNum = null;
      let amountText = "";
      let ruleApplied = "";

      if (relativeLevel === 1) {
        bonusType = "Cash";
        amountText = "Outright";
        ruleApplied = "Direct Bonus";
      } else if (relativeLevel === 2) {
        bonusType = "Product";
        amountNum = 1;
        ruleApplied = "Indirect Bonus";
      } else {
        bonusType = "Cash";
        amountNum = 200;
        ruleApplied = "Developer Bonus";
      }

      const earner = currentSponsor.name;

      const exists = await q(
        `select 1 from bonus_ledger
         where earner_name=$1 and source_member_name=$2 and relative_level=$3 and reason='Member Registration'
         limit 1`,
        [earner, name.trim(), relativeLevel]
      );

      if (!exists.rowCount) {
        await q(
          `insert into bonus_ledger
            (created_at, earner_name, source_member_name, relative_level, bonus_type, amount_num, amount_text, rule_applied, reason)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [now, earner, name.trim(), relativeLevel, bonusType, amountNum, amountText, ruleApplied, "Member Registration"]
        );
        await rebuildMemberBonusSummary(earner);
      }

      const nextSponsorName = currentSponsor.sponsor_name;
      if (!nextSponsorName) break;

      const next = await q(`select * from members where name=$1`, [nextSponsorName]);
      if (!next.rowCount) break;

      currentSponsor = next.rows[0];
      relativeLevel++;
    }

    res.json({ ok: true, memberId });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

/** =========================
 *  REDEEM BONUS
 *  ========================= */
app.post("/api/redemptions", async (req, res) => {
  try {
    const { memberName, type, qty, notes } = req.body;

    if (!memberName) return res.status(400).json({ error: "Please select a member." });
    if (!type) return res.status(400).json({ error: "Please select redemption type." });

    const qtty = Number(qty);
    if (!qtty || qtty <= 0) return res.status(400).json({ error: "Quantity must be greater than zero." });

    const s = await q(`select balance_cash, balance_product from member_bonus_summary where member_name=$1`, [memberName]);
    const balCash = s.rowCount ? Number(s.rows[0].balance_cash) : 0;
    const balProd = s.rowCount ? Number(s.rows[0].balance_product) : 0;

    if (type === "Cash" && qtty > balCash) return res.status(400).json({ error: "Insufficient cash balance." });
    if (type === "Product" && qtty > balProd) return res.status(400).json({ error: "Insufficient product balance." });

    await q(
      `insert into redemptions (created_at, member_name, redeem_type, qty, source, notes)
       values ($1,$2,$3,$4,$5,$6)`,
      [new Date().toISOString(), memberName, type, qtty, "Member Profile", notes || ""]
    );

    await rebuildMemberBonusSummary(memberName);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

/** =========================
 *  BASIC READ APIs (for website lists)
 *  ========================= */
app.get("/api/members", async (_req, res) => {
  const r = await q(`select * from members order by id desc`);
  res.json(r.rows);
});

app.get("/api/bonus-ledger", async (_req, res) => {
  const r = await q(`select * from bonus_ledger order by id desc`);
  res.json(r.rows);
});

app.get("/api/summary/:name", async (req, res) => {
  const r = await q(`select * from member_bonus_summary where member_name=$1`, [req.params.name]);
  res.json(r.rowCount ? r.rows[0] : null);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`API listening on ${PORT}`));
