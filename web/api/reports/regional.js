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

function cashAmount(row) {
  // Handles older "Outright" rows where amount_num may be null
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

    // 1) RM profile
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

    const rmLevel = toNumber(rmRow.level);

    // 2) All members under this RM (exclude the RM row itself from downline list)
    const { data: underRmRows, error: membersErr } = await sb
      .from("members")
      .select(
        "id, name, member_id, contact, email, membership_type, level, address, sponsor_name, regional_manager, area_region, created_at"
      )
      .eq("regional_manager", rm)
      .order("level", { ascending: true })
      .order("created_at", { ascending: true });

    if (membersErr) {
      return res.status(500).json({ error: membersErr.message });
    }

    const downlines = (underRmRows || [])
      .filter((m) => String(m.name || "").trim() !== rm)
      .map((m) => {
        const absLevel = toNumber(m.level);
        const relativeLevel = Math.max(1, absLevel - rmLevel);
        return {
          ...m,
          relative_level: relativeLevel,
        };
      });

    // 3) Count by membership type
    const byType = downlines.reduce((acc, row) => {
      const key = row.membership_type || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // 4) Bonus ledger entries earned by this RM
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

    // 5) Redemptions for this RM
    const { data: redemptionRows, error: redErr } = await sb
      .from("redemptions")
      .select("created_at, member_name, redeem_type, qty, source, notes")
      .eq("member_name", rm);

    if (redErr) {
      return res.status(500).json({ error: redErr.message });
    }

    const redemptions = Array.isArray(redemptionRows) ? redemptionRows : [];
    const redeemedCash = redemptions
      .filter((r) => String(r.redeem_type || "").toLowerCase() === "cash")
      .reduce((sum, r) => sum + toNumber(r.qty), 0);

    const redeemedProduct = redemptions
      .filter((r) => String(r.redeem_type || "").toLowerCase() === "product")
      .reduce((sum, r) => sum + toNumber(r.qty), 0);

    // 6) RM rebates (best-effort because column names may vary)
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

    // 7) Bonus totals
    const totalCashBonus = bonuses
      .filter((b) => String(b.bonus_type || "").toLowerCase() === "cash")
      .reduce((sum, b) => sum + cashAmount(b), 0);

    const totalProductBonus = bonuses
      .filter((b) => String(b.bonus_type || "").toLowerCase() === "product")
      .reduce((sum, b) => sum + toNumber(b.amount_num), 0);

    const totalCashEarned = totalCashBonus + totalRebates;
    const runningBalanceCash = totalCashEarned - redeemedCash;
    const remainingProductBalance = totalProductBonus - redeemedProduct;

    // 8) Levels data for report table
    // Show all levels present in genealogy, even 8+.
    // Bonus only applies to levels 1..7.
    const maxDownlineLevel = downlines.reduce(
      (max, row) => Math.max(max, toNumber(row.relative_level)),
      0
    );
    const maxBonusLevel = bonuses.reduce(
      (max, row) => Math.max(max, toNumber(row.relative_level)),
      0
    );
    const maxLevel = Math.max(7, maxDownlineLevel, maxBonusLevel);

    function levelLabel(level) {
      if (level === 1) return "D.C. BONUS";
      if (level === 2) return "IND. BONUS";
      if (level >= 3 && level <= 7) return "DEV. BONUS";
      return "";
    }

    const levels = Array.from({ length: maxLevel }, (_, i) => {
      const level = i + 1;

      const levelMembers = downlines.filter(
        (m) => toNumber(m.relative_level) === level
      );

      const levelBonusRows = bonuses.filter(
        (b) => toNumber(b.relative_level) === level
      );

      let bonusTotal = 0;
      let bonusType = null;

      if (level === 1) {
        bonusType = "Cash";
        bonusTotal = levelBonusRows
          .filter((b) => String(b.bonus_type || "").toLowerCase() === "cash")
          .reduce((sum, b) => sum + cashAmount(b), 0);
      } else if (level === 2) {
        bonusType = "Product";
        bonusTotal = levelBonusRows
          .filter((b) => String(b.bonus_type || "").toLowerCase() === "product")
          .reduce((sum, b) => sum + toNumber(b.amount_num), 0);
      } else if (level >= 3 && level <= 7) {
        bonusType = "Cash";
        bonusTotal = levelBonusRows
          .filter((b) => String(b.bonus_type || "").toLowerCase() === "cash")
          .reduce((sum, b) => sum + cashAmount(b), 0);
      } else {
        // Level 8 and above: show genealogy, but no bonus
        bonusType = null;
        bonusTotal = 0;
      }

      const memberRows = levelMembers.map((m) => {
        const matchingBonus = levelBonusRows.find(
          (b) => String(b.source_member_name || "").trim() === String(m.name || "").trim()
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
        label: levelLabel(level),
        bonus_type: bonusType,
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
