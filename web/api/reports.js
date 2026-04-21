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

function isOutrightCashBonus(row) {
  return (
    norm(bonusType(row)) === "cash" &&
    norm(bonusLabel(row)) === "d.c. bonus"
  );
}

function mapRebateRows(rows, kind) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    created_at: row.created_at,
    earner_name: row.receiver_name,
    source_member_name: row.buyer_name,
    relative_level: null,
    bonus_type: "Cash",
    amount: toNumber(row.rebate),
    rule_applied: kind,
    reason: kind,
    bonus_label:
      kind === "rm_rebate"
        ? "RM REBATE"
        : kind === "am_rebate"
          ? "AM REBATE"
          : "REBATE",
    is_redeemable: true,
    ledger_source: kind,
    product: row.product ?? null,
    qty: row.qty ?? null,
    unit_type: row.unit_type ?? null,
  }));
}

function mapGroupSalesRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    created_at: row.created_at,
    earner_name: row.receiver_name,
    source_member_name: row.buyer_name,
    relative_level: null,
    bonus_type: "Cash",
    amount: toNumber(row.bonus),
    rule_applied: "group_sales_bonus",
    reason: "group_sales_bonus",
    bonus_label: "GROUP SALES BONUS",
    is_redeemable: true,
    ledger_source: "group_sales_bonus",
    product: row.product ?? null,
    qty: row.qty ?? null,
    unit_type: row.unit_type ?? null,
  }));
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

async function fetchRowsByReceiver(sb, table, selectCols, receiverName) {
  let { data, error } = await sb
    .from(table)
    .select(selectCols)
    .ilike("receiver_name", receiverName)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return { data: null, error };
  }

  let rows = Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    const r2 = await sb
      .from(table)
      .select(selectCols)
      .ilike("receiver_name", `%${receiverName}%`)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!r2.error && Array.isArray(r2.data)) {
      rows = r2.data;
    }
  }

  return { data: rows, error: null };
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
  const memberType = norm(member.membership_type);
  const isAreaManager = memberType === "area manager";
  const isRegionalManager = memberType === "regional manager";

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

  let rmRebates = [];
  let amRebates = [];
  let groupSalesBonuses = [];

  if (isRegionalManager) {
    const result = await fetchRowsByReceiver(
      sb,
      "rm_rebates_ledger",
      "created_at, receiver_name, buyer_name, product, qty, unit_type, rebate",
      memberName
    );
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    rmRebates = result.data || [];
  }

  if (isAreaManager) {
    const result = await fetchRowsByReceiver(
      sb,
      "am_rebates_ledger",
      "created_at, receiver_name, buyer_name, product, qty, unit_type, rebate",
      memberName
    );
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    amRebates = result.data || [];
  }

  {
    const result = await fetchRowsByReceiver(
      sb,
      "group_sales_bonus_ledger",
      "created_at, receiver_name, buyer_name, product, qty, unit_type, bonus",
      memberName
    );
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    groupSalesBonuses = result.data || [];
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

  let outright_cash = 0;
  let total_cash = 0;
  let redeemable_cash = 0;
  let total_product = 0;

  for (const b of bonuses ?? []) {
    const type = norm(bonusType(b));
    const amt = bonusAmount(b);

    if (type === "cash") {
      if (isOutrightCashBonus(b)) {
        outright_cash += amt;
      }
      if (isRedeemableBonus(b)) {
        total_cash += amt;
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

  const total_am_rebates = (amRebates ?? []).reduce(
    (sum, row) => sum + toNumber(row.rebate),
    0
  );

  const total_group_sales_bonus = (groupSalesBonuses ?? []).reduce(
    (sum, row) => sum + toNumber(row.bonus),
    0
  );

  total_cash += total_rm_rebates + total_am_rebates + total_group_sales_bonus;
  redeemable_cash +=
    total_rm_rebates + total_am_rebates + total_group_sales_bonus;

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
    const bonusTotal = levelBonusRows.reduce(
      (sum, b) => sum + bonusAmount(b),
      0
    );

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

  const extraCompRows = [
    ...mapRebateRows(rmRebates, "rm_rebate"),
    ...mapRebateRows(amRebates, "am_rebate"),
    ...mapGroupSalesRows(groupSalesBonuses),
  ];

  const combinedBonuses = [...(bonuses ?? []), ...extraCompRows].sort((a, b) =>
    String(a.created_at || "").localeCompare(String(b.created_at || ""))
  );

  return res.status(200).json({
    member,
    totals: {
      outright_cash,
      total_cash,
      redeemable_cash,
      redeemed_cash,
      balance_cash,
      total_product,
      redeemed_product,
      balance_product,
      total_rm_rebates,
      total_am_rebates,
      total_group_sales_bonus,
      total_extra_compensation:
        total_rm_rebates + total_am_rebates + total_group_sales_bonus,
    },
    bonuses: combinedBonuses,
    base_bonus_ledger: bonuses ?? [],
    redemptions: redemptions ?? [],
    rm_rebates: rmRebates ?? [],
    am_rebates: amRebates ?? [],
    group_sales_bonus: groupSalesBonuses ?? [],
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

  const rmRebateLookup = await trySelectByColumn(
    sb,
    "rm_rebates_ledger",
    ["receiver_name"],
    rm
  );
  const rmRebateRows = rmRebateLookup.data || [];

  const groupSalesLookup = await trySelectByColumn(
    sb,
    "group_sales_bonus_ledger",
    ["receiver_name"],
    rm
  );
  const groupSalesRows = groupSalesLookup.data || [];

  const totalRmRebates = rmRebateRows.reduce(
    (sum, row) => sum + toNumber(row.rebate),
    0
  );

  const totalGroupSalesBonus = groupSalesRows.reduce(
    (sum, row) => sum + toNumber(row.bonus),
    0
  );

  let outrightCashBonus = 0;
  let redeemableCashBonus = 0;

  for (const b of bonuses) {
    if (norm(bonusType(b)) === "cash") {
      if (isOutrightCashBonus(b)) {
        outrightCashBonus += bonusAmount(b);
      }
      if (isRedeemableBonus(b)) {
        redeemableCashBonus += bonusAmount(b);
      }
    }
  }

  const totalProductBonus = bonuses
    .filter((b) => norm(bonusType(b)) === "product")
    .reduce((sum, b) => sum + bonusAmount(b), 0);

  const totalRebates = totalRmRebates;
  const totalCashBonus = redeemableCashBonus + totalGroupSalesBonus;
  const totalCashEarned =
    redeemableCashBonus + totalRmRebates + totalGroupSalesBonus;
  const runningBalanceCash = totalCashEarned - redeemedCash;
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
    const bonusTotal = levelBonusRows.reduce(
      (sum, b) => sum + bonusAmount(b),
      0
    );

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
      outrightCashBonus,
      totalMembers: downlines.length,
      totalRebates,
      totalRmRebates,
      totalGroupSalesBonus,
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
    rm_rebates: rmRebateRows,
    group_sales_bonus: groupSalesRows,
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
