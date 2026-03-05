// web/api/reports/member.js
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

function isOutright(amountText) {
  return norm(amountText) === "outright";
}

// If amount_num is missing/0 but it's Outright, count it as 600
function cashAmount(b) {
  const n = Number(b?.amount_num);
  if (Number.isFinite(n) && n !== 0) return n;
  if (isOutright(b?.amount_text)) return 600;
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

    const inputName = String(req.query?.name ?? "").trim();
    if (!inputName) return res.status(400).json({ error: "Missing ?name=" });

    const sb = supabaseAdmin();

    // 1) Member (case-insensitive)
    const { data: member, error: memberErr } = await sb
      .from("members")
      .select("*")
      .ilike("name", inputName)
      .maybeSingle();

    if (memberErr) return res.status(400).json({ error: memberErr.message });
    if (!member) return res.status(404).json({ error: "Member not found." });

    // Use canonical name from DB to avoid casing/spacing mismatch
    const memberName = String(member.name ?? "").trim();

    // 2) Bonus ledger for this earner
    let { data: bonuses, error: bonusErr } = await sb
      .from("bonus_ledger")
      .select(
        "created_at, earner_name, source_member_name, relative_level, bonus_type, amount_num, amount_text, rule_applied, reason"
      )
      .ilike("earner_name", memberName)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (bonusErr) return res.status(400).json({ error: bonusErr.message });

    // Fallback if no rows (handles trailing spaces / weird casing in DB)
    if ((bonuses ?? []).length === 0) {
      const r2 = await sb
        .from("bonus_ledger")
        .select(
          "created_at, earner_name, source_member_name, relative_level, bonus_type, amount_num, amount_text, rule_applied, reason"
        )
        .ilike("earner_name", `%${memberName}%`)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!r2.error && Array.isArray(r2.data)) bonuses = r2.data;
    }

    // 3) Redemptions for this member
    let { data: redemptions, error: redErr } = await sb
      .from("redemptions")
      .select("created_at, member_name, redeem_type, qty, source, notes")
      .ilike("member_name", memberName)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (redErr) return res.status(400).json({ error: redErr.message });

    // Fallback if no rows
    if ((redemptions ?? []).length === 0) {
      const r2 = await sb
        .from("redemptions")
        .select("created_at, member_name, redeem_type, qty, source, notes")
        .ilike("member_name", `%${memberName}%`)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!r2.error && Array.isArray(r2.data)) redemptions = r2.data;
    }

    // --- Totals logic ---
    let total_cash = 0;        // includes outright 600
    let redeemable_cash = 0;   // excludes outright
    let total_product = 0;

    for (const b of bonuses ?? []) {
      if (b.bonus_type === "Cash") {
        const amt = cashAmount(b);
        total_cash += amt;
        if (!isOutright(b.amount_text)) redeemable_cash += amt;
      } else if (b.bonus_type === "Product") {
        const n = Number(b.amount_num ?? 0) || 0;
        total_product += n;
      }
    }

    let redeemed_cash = 0;
    let redeemed_product = 0;

    for (const r of redemptions ?? []) {
      const q = Number(r.qty ?? 0) || 0;
      if (r.redeem_type === "Cash") redeemed_cash += q;
      else if (r.redeem_type === "Product") redeemed_product += q;
    }

    const balance_cash = redeemable_cash - redeemed_cash; // outright not counted
    const balance_product = total_product - redeemed_product;

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
      },
      bonuses: bonuses ?? [],
      redemptions: redemptions ?? [],
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
