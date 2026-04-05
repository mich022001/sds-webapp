import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ordinal(level) {
  if (level % 100 >= 11 && level % 100 <= 13) return `${level}th`;
  if (level % 10 === 1) return `${level}st`;
  if (level % 10 === 2) return `${level}nd`;
  if (level % 10 === 3) return `${level}rd`;
  return `${level}th`;
}

function bonusAmount(row) {
  return toNumber(row?.amount);
}

function bonusType(row) {
  return String(row?.bonus_type ?? "").trim();
}

function bonusLabel(row) {
  return String(row?.bonus_label ?? "").trim();
}

function isRedeemableBonus(row) {
  return row?.is_redeemable === true;
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

async function handleMemberReport(sb, req, res) {
  const inputName = String(req.query?.name ?? "").trim();
  if (!inputName) {
    return res.status(400).json({ error: "Missing ?name=" });
  }

  const { data: member, error: memberErr } = await sb
    .from("members")
    .select("*")
    .ilike("name", inputName)
    .maybeSingle();

  if (memberErr) return res.status(400).json({ error: memberErr.message });
  if (!member) return res.status(404).json({ error: "Member not found." });

  const memberName = String(member.name ?? "").trim();

  let { data: bonuses, error: bonusErr } = await sb
    .from("bonus_ledger")
    .select(
      "created_at, earner_name, source_member_name, relative_level, bonus_type, amount, rule_applied, reason, bonus_label, is_redeemable"
    )
    .ilike("earner_name", memberName)
    .order("relative_level", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1000);

  if (bonusErr) return res.status(400).json({ error: bonusErr.message });

  if ((bonuses ?? []).length === 0) {
    const r2 = await sb
      .from("bonus_ledger")
      .select(
        "created_at, earner_name, source_member_name, relative_level, bonus_type, amount, rule_applied, reason, bonus_label, is_redeemable"
      )
      .ilike("earner_name", `%${memberName}%`)
      .order("relative_level", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1000);

    if (!r2.error && Array.isArray(r2.data)) bonuses = r2.data;
  }

  let { data: redemptions, error: redErr } = await sb
    .from("redemptions")
    .select("created_at, member_name, redeem_type, qty, source, notes")
    .ilike("member_name", memberName)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (redErr) return res.status(400).json({ error: redErr.message });

  if ((redemptions ?? []).length === 0) {
    const r2 = await sb
      .from("redemptions")
      .select("created_at, member_name, redeem_type, qty, source, notes")
      .ilike("member_name", `%${memberName}%`)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!r2.error && Array.isArray(r2.data)) redemptions = r2.data;
  }

  let { data: rmRebates, error: rmRebatesErr } = await sb
    .from("rm_rebates_ledger")
    .select("created_at, receiver_name, buyer_name, product, qty, unit_type, rebate")
    .ilike("receiver_name", memberName)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (rmRebatesErr) return res.status(400).json({ error: rmRebatesErr.message });

  if ((rmRebates ?? []).length === 0) {
    const r2 = await sb
      .from("rm_rebates_ledger")
      .select("created_at, receiver_name, buyer_name, product, qty, unit_type, rebate")
      .ilike("receiver_name", `%${memberName}%`)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!r2.error && Array.isArray(r2.data)) rmRebates = r2.data;
  }

  const { data: allMembers, error: allMembersErr } = await sb
    .from("members")
    .select(
      "id, name, member_id, contact, email, membership_type, level, address, sponsor_name, regional_manager, area_region, created_at"
    )
    .order("created_at", { ascending: true });

  if (allMembersErr) {
    return res.status(400).json({ error: allMembersErr.message });
  }

  const rows = Array.isArray(allMembers) ? allMembers : [];
  const childrenBySponsor = new Map();

  for (const row of rows) {
    const sponsorKey = norm(row.sponsor_name || "SDS");
    if (!childrenBySponsor.has(sponsorKey)) {
      childrenBySponsor.set(sponsorKey, []);
    }
    childrenBySponsor.get(sponsorKey).push(row);
  }

  const visitedNames = new Set();
  const downlines = [];
  const queue = [{ sponsorName: memberName, relativeLevel: 1 }];

  while (queue.length > 0) {
    const current = queue.shift();
    const sponsorKey = norm(current.sponsorName);
    const children = childrenBySponsor.get(sponsorKey) || [];

    for (const child of children) {
      const childKey = norm(child.name);
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

  downlines.sort((a, b) => {
    const lvl = toNumber(a.relative_level) - toNumber(b.relative_level);
    if (lvl !== 0) return lvl;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });

  let total_cash = 0;
  let redeemable_cash = 0;
  let total_product = 0;

  for (const b of bonuses ?? []) {
    const type = norm(bonusType(b));
    const amt = bonusAmount(b);

    if (type === "cash") {
      total_cash += amt;
      if (isRedeemableBonus(b)) {
        redeemable_cash += amt;
      }
    } else if (type === "product") {
      total_product += amt;
    }
  }

  const total_rm_rebates = (rmRebates ?? []).reduce(
    (sum, row) => sum + toNumber(row.rebate),
    0
  );

  total_cash += total_rm_rebates;
  redeemable_cash += total_rm_rebates;

  let redeemed_cash = 0;
  let redeemed_product = 0;

  for (const r of redemptions ?? []) {
    const q = toNumber(r.qty);
    if (norm(r.redeem_type) === "cash") redeemed_cash += q;
    else if (norm(r.redeem_type) === "product") redeemed_product += q;
  }

  const balance_cash = redeemable_cash - redeemed_cash;
  const balance_product = total_product - redeemed_product;

  const maxDownlineLevel = downlines.reduce(
    (max, row) => Math.max(max, toNumber(row.relative_level)),
    0
  );

  const maxBonusLevel = (bonuses ?? []).reduce(
    (max, row) => Math.max(max, toNumber(row.relative_level)),
    0
  );

  const maxLevel = Math.max(1, maxDownlineLevel, maxBonusLevel);

  const levels = Array.from({ length: maxLevel }, (_, i) => {
    const level = i + 1;

    const levelMembers = downlines.filter(
      (m) => toNumber(m.relative_level) === level
    );

    const levelBonusRows = (bonuses ?? []).filter(
      (b) => toNumber(b.relative_level) === level
    );

    const label = levelBonusRows[0] ? bonusLabel(levelBonusRows[0]) : "";
    const type = levelBonusRows[0] ? bonusType(levelBonusRows[0]) : "";
    const bonusTotal = levelBonusRows.reduce((sum, b) => sum + bonusAmount(b), 0);

    const memberRows = levelMembers.map((m) => {
      const matchingBonus = levelBonusRows.find(
        (b) => norm(b.source_member_name) === norm(m.name)
      );

      return {
        name: m.name,
        membership_type: m.membership_type,
        sponsor_name: m.sponsor_name || "SDS",
        created_at: m.created_at,
        relative_level: level,
        bonus_value: matchingBonus ? bonusAmount(matchingBonus) : 0,
        bonus_type: matchingBonus ? bonusType(matchingBonus) : type,
        bonus_label: matchingBonus ? bonusLabel(matchingBonus) : label,
        is_redeemable: matchingBonus ? isRedeemableBonus(matchingBonus) : null,
      };
    });

    return {
      level,
      level_title: `${ordinal(level)} Level`,
      label,
      bonus_type: type,
      bonus_total: bonusTotal,
      member_count: memberRows.length,
      members: memberRows,
    };
  });

  return res.status(200).json({
    member,
    totals: {
      total_cash,
      redeemable_cash,
      redeemed_cash,
      balance_cash,
      total_product,
      redeemed_product,
      balance_product,
      total_rm_rebates,
    },
    bonuses: bonuses ?? [],
    redemptions: redemptions ?? [],
    rm_rebates: rmRebates ?? [],
    levels,
    downlines,
  });
}

async function handleRegionalReport(sb, req, res) {
  const rm = String(req.query.rm || "").trim();
  if (!rm) {
    return res.status(400).json({ error: "Missing rm query parameter" });
  }

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
  const childrenBySponsor = new Map();

  for (const row of rows) {
    const sponsorKey = norm(row.sponsor_name || "SDS");
    if (!childrenBySponsor.has(sponsorKey)) {
      childrenBySponsor.set(sponsorKey, []);
    }
    childrenBySponsor.get(sponsorKey).push(row);
  }

  const visitedNames = new Set();
  const downlines = [];
  const queue = [{ sponsorName: rm, relativeLevel: 1 }];

  while (queue.length > 0) {
    const current = queue.shift();
    const sponsorKey = norm(current.sponsorName);
    const children = childrenBySponsor.get(sponsorKey) || [];

    for (const child of children) {
      const childKey = norm(child.name);
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

  downlines.sort((a, b) => {
    const lvl = toNumber(a.relative_level) - toNumber(b.relative_level);
    if (lvl !== 0) return lvl;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });

  const byType = downlines.reduce((acc, row) => {
    const key = row.membership_type || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const { data: bonusRows, error: bonusErr } = await sb
    .from("bonus_ledger")
    .select(
      "created_at, earner_name, source_member_name, relative_level, bonus_type, amount, rule_applied, reason, bonus_label, is_redeemable"
    )
    .eq("earner_name", rm)
    .order("relative_level", { ascending: true })
    .order("created_at", { ascending: true });

  if (bonusErr) {
    return res.status(500).json({ error: bonusErr.message });
  }

  const bonuses = Array.isArray(bonusRows) ? bonusRows : [];

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

  const rebateLookup = await trySelectByColumn(
    sb,
    "rm_rebates_ledger",
    ["receiver_name"],
    rm
  );

  const rebateRows = rebateLookup.data || [];
  const totalRebates = rebateRows.reduce((sum, row) => {
    return sum + toNumber(row.rebate);
  }, 0);

  const totalCashBonus = bonuses
    .filter((b) => norm(bonusType(b)) === "cash")
    .reduce((sum, b) => sum + bonusAmount(b), 0);

  const redeemableCashBonus = bonuses
    .filter((b) => norm(bonusType(b)) === "cash" && isRedeemableBonus(b))
    .reduce((sum, b) => sum + bonusAmount(b), 0);

  const totalProductBonus = bonuses
    .filter((b) => norm(bonusType(b)) === "product")
    .reduce((sum, b) => sum + bonusAmount(b), 0);

  const totalCashEarned = totalCashBonus + totalRebates;
  const runningBalanceCash = redeemableCashBonus + totalRebates - redeemedCash;
  const remainingProductBalance = totalProductBonus - redeemedProduct;

  const maxDownlineLevel = downlines.reduce(
    (max, row) => Math.max(max, toNumber(row.relative_level)),
    0
  );
  const maxBonusLevel = bonuses.reduce(
    (max, row) => Math.max(max, toNumber(row.relative_level)),
    0
  );

  const maxLevel = Math.max(1, maxDownlineLevel, maxBonusLevel);

  const levels = Array.from({ length: maxLevel }, (_, i) => {
    const level = i + 1;

    const levelMembers = downlines.filter(
      (m) => toNumber(m.relative_level) === level
    );

    const levelBonusRows = bonuses.filter(
      (b) => toNumber(b.relative_level) === level
    );

    const label = levelBonusRows[0] ? bonusLabel(levelBonusRows[0]) : "";
    const type = levelBonusRows[0] ? bonusType(levelBonusRows[0]) : "";
    const bonusTotal = levelBonusRows.reduce((sum, b) => sum + bonusAmount(b), 0);

    const memberRows = levelMembers.map((m) => {
      const matchingBonus = levelBonusRows.find(
        (b) => norm(b.source_member_name) === norm(m.name)
      );

      return {
        name: m.name,
        membership_type: m.membership_type,
        sponsor_name: m.sponsor_name || "SDS",
        created_at: m.created_at,
        relative_level: level,
        bonus_value: matchingBonus ? bonusAmount(matchingBonus) : 0,
        bonus_type: matchingBonus ? bonusType(matchingBonus) : type,
        bonus_label: matchingBonus ? bonusLabel(matchingBonus) : label,
        is_redeemable: matchingBonus ? isRedeemableBonus(matchingBonus) : null,
      };
    });

    return {
      level,
      level_title: `${ordinal(level)} Level`,
      label,
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
      redeemableCashBonus,
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
    rm_rebates: rebateRows,
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const type = String(req.query?.type ?? "").trim().toLowerCase();
    const sb = supabaseAdmin();

    if (type === "member") {
      return await handleMemberReport(sb, req, res);
    }

    if (type === "regional") {
      return await handleRegionalReport(sb, req, res);
    }

    return res.status(400).json({
      error: "Missing or invalid ?type=member or ?type=regional",
    });
  } catch (e) {
    return res.status(500).json({
      error: String(e?.message ?? e),
    });
  }
}
