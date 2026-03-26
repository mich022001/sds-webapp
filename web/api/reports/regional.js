import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

function cashAmount(row) {
  if (row.amount_num != null) return toNumber(row.amount_num);
  if (String(row.amount_text || "").trim().toLowerCase() === "outright") return 600;
  return 0;
}

async function trySelectByColumn(sb, table, candidates, value) {
  for (const col of candidates) {
    const { data, error } = await sb.from(table).select("*").eq(col, value);
    if (!error) {
      return { data: Array.isArray(data) ? data : [], column: col };
    }
  }
  return { data: [], column: null };
}

function ordinal(level) {
  if (level % 100 >= 11 && level % 100 <= 13) return `${level}th`;
  if (level % 10 === 1) return `${level}st`;
  if (level % 10 === 2) return `${level}nd`;
  if (level % 10 === 3) return `${level}rd`;
  return `${level}th`;
}

function bonusLabel(level) {
  if (level === 1) return "D.C. BONUS";
  if (level === 2) return "IND. BONUS";
  if (level >= 3 && level <= 7) return "DEV. BONUS";
  return "";
}

function levelBonusType(level) {
  if (level === 1) return "Cash";
  if (level === 2) return "Product";
  if (level >= 3 && level <= 7) return "Cash";
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rm = String(req.query.rm || "").trim();
    if (!rm) {
      return res.status(400).json({ error: "Missing rm query parameter" });
    }

    const sb = supabaseAdmin();

    // 1) Load RM profile
    const { data: rmRow, error: rmErr } = await sb
      .from("members")
      .select(
        "id, name, member_id, contact, email, membership_type, level, address, sponsor_name, regional_manager, area_region, created_at"
      )
      .eq("name", rm)
      .maybeSingle();

    if (rmErr) {
      return res.status(500).json({ error: rmErr.message });
    }

    if (!rmRow) {
      return res.status(404).json({ error: `Regional Manager not found: ${rm}` });
    }

    // 2) Load all members so we can build genealogy by sponsor_name
    const { data: allMembers, error: allMembersErr } = await sb
      .from("members")
      .select(
        "id, name, member_id, contact, email, membership_type, level, address, sponsor_name, regional_manager, area_region, created_at"
      )
      .order("created_at", { ascending: true });

    if (allMembersErr) {
      return res.status(500).json({ error: allMembersErr.message });
    }

    const rows = Array.isArray(allMembers) ? allMembers : [];

    // Build sponsor -> children map
    const childrenBySponsor = new Map();
    for (const row of rows) {
      const sponsorKey = norm(row.sponsor_name || "SDS");
      if (!childrenBySponsor.has(sponsorKey)) {
        childrenBySponsor.set(sponsorKey, []);
      }
      childrenBySponsor.get(sponsorKey).push(row);
    }

    // 3) Traverse descendants from the selected RM using sponsor chain
    const visitedNames = new Set();
    const downlines = [];
    const queue = [{ sponsorName: rm, relativeLevel: 1 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const sponsorKey = norm(current.sponsorName);
      const children = childrenBySponsor.get(sponsorKey) || [];

      for (const child of children) {
        const childKey = norm(child.name);

        // Prevent loops / duplicate processing by member name.
        // Still fragile if duplicate member names exist in the system.
        if (visitedNames.has(childKey)) continue;
        visitedNames.add(childKey);

        const item = {
          ...child,
          relative_level: current.relativeLevel,
        };

        downlines.push(item);

        queue.push({
          sponsorName: child.name,
          relativeLevel: current.relativeLevel + 1,
        });
      }
    }

    // Sort for stable display
    downlines.sort((a, b) => {
      const lvl = toNumber(a.relative_level) - toNumber(b.relative_level);
      if (lvl !== 0) return lvl;
      return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    });

    // 4) Count by membership type
    const byType = downlines.reduce((acc, row) => {
      const key = row.membership_type || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // 5) Bonus ledger entries earned by this RM
    const { data: bonusRows, error: bonusErr } = await sb
      .from("bonus_ledger")
      .select(
        "created_at, earner_name, source_member_name, relative_level, bonus_type, amount_num, amount_text, rule_applied, reason"
      )
      .eq("earner_name", rm)
      .order("relative_level", { ascending: true })
      .order("created_at", { ascending: true });

    if (bonusErr) {
      return res.status(500).json({ error: bonusErr.message });
    }

    const bonuses = Array.isArray(bonusRows) ? bonusRows : [];

    // 6) Redemptions for this RM
    const { data: redemptionRows, error: redErr } = await sb
      .from("redemptions")
      .select("created_at, member_name, redeem_type, qty, source, notes")
      .eq("member_name", rm);

    if (redErr) {
      return res.status(500).json({ error: redErr.message });
    }

    const redemptions = Array.isArray(redemptionRows) ? redemptionRows : [];

    const redeemedCash = redemptions
      .filter((r) => norm(r.redeem_type) === "cash")
      .reduce((sum, r) => sum + toNumber(r.qty), 0);

    const redeemedProduct = redemptions
      .filter((r) => norm(r.redeem_type) === "product")
      .reduce((sum, r) => sum + toNumber(r.qty), 0);

    // 7) RM rebates
    const rebateLookup = await trySelectByColumn(
      sb,
      "rm_rebates_ledger",
      ["rm_name", "member_name", "name"],
      rm
    );

    const rebateRows = rebateLookup.data || [];
    const totalRebates = rebateRows.reduce((sum, row) => {
      return (
        sum +
        toNumber(
          row.amount_num ??
            row.amount ??
            row.rebate_amount ??
            row.value ??
            row.qty ??
            0
        )
      );
    }, 0);

    // 8) Overall bonus totals
    const totalCashBonus = bonuses
      .filter((b) => norm(b.bonus_type) === "cash")
      .reduce((sum, b) => sum + cashAmount(b), 0);

    const totalProductBonus = bonuses
      .filter((b) => norm(b.bonus_type) === "product")
      .reduce((sum, b) => sum + toNumber(b.amount_num), 0);

    const totalCashEarned = totalCashBonus + totalRebates;
    const runningBalanceCash = totalCashEarned - redeemedCash;
    const remainingProductBalance = totalProductBonus - redeemedProduct;

    // 9) Build per-level dataset
    const maxDownlineLevel = downlines.reduce(
      (max, row) => Math.max(max, toNumber(row.relative_level)),
      0
    );
    const maxBonusLevel = bonuses.reduce(
      (max, row) => Math.max(max, toNumber(row.relative_level)),
      0
    );

    // Do not force 7 columns. Show only actual levels present.
    // Level 8+ will appear naturally if present.
    const maxLevel = Math.max(1, maxDownlineLevel, maxBonusLevel);

    const levels = Array.from({ length: maxLevel }, (_, i) => {
      const level = i + 1;

      const levelMembers = downlines.filter(
        (m) => toNumber(m.relative_level) === level
      );

      const levelBonusRows = bonuses.filter(
        (b) => toNumber(b.relative_level) === level
      );

      const type = levelBonusType(level);

      let bonusTotal = 0;
      if (level === 1) {
        bonusTotal = levelBonusRows
          .filter((b) => norm(b.bonus_type) === "cash")
          .reduce((sum, b) => sum + cashAmount(b), 0);
      } else if (level === 2) {
        bonusTotal = levelBonusRows
          .filter((b) => norm(b.bonus_type) === "product")
          .reduce((sum, b) => sum + toNumber(b.amount_num), 0);
      } else if (level >= 3 && level <= 7) {
        bonusTotal = levelBonusRows
          .filter((b) => norm(b.bonus_type) === "cash")
          .reduce((sum, b) => sum + cashAmount(b), 0);
      } else {
        bonusTotal = 0;
      }

      const memberRows = levelMembers.map((m) => {
        const matchingBonus = levelBonusRows.find(
          (b) => norm(b.source_member_name) === norm(m.name)
        );

        let bonusValue = 0;
        if (level === 1 && matchingBonus) bonusValue = cashAmount(matchingBonus);
        if (level === 2 && matchingBonus) bonusValue = toNumber(matchingBonus.amount_num);
        if (level >= 3 && level <= 7 && matchingBonus) bonusValue = cashAmount(matchingBonus);

        return {
          name: m.name,
          membership_type: m.membership_type,
          sponsor_name: m.sponsor_name || "SDS",
          created_at: m.created_at,
          relative_level: level,
          bonus_value: level <= 7 ? bonusValue : 0,
        };
      });

      return {
        level,
        level_title: `${ordinal(level)} Level`,
        label: bonusLabel(level),
        bonus_type: type,
        bonus_total: bonusTotal,
        member_count: memberRows.length,
        members: memberRows,
      };
    });

    return res.status(200).json({
      rm,
      profile: {
        name: rmRow.name,
        member_id: rmRow.member_id,
        contact: rmRow.contact,
        email: rmRow.email,
        address: rmRow.address,
        membership_type: rmRow.membership_type,
        level: rmRow.level,
        area_region: rmRow.area_region,
      },
      totals: {
        totalMembers: downlines.length,
        totalRebates,
        totalCashBonus,
        totalCashEarned,
        redeemedCash,
        runningBalanceCash,
        totalProductBonus,
        redeemedProduct,
        remainingProductBalance,
      },
      byType,
      levels,
      members: downlines,
    });
  } catch (e) {
    return res.status(500).json({
      error: e?.message || "Internal server error",
    });
  }
}
