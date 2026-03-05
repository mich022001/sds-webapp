// web/api/reports/member.js
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function isOutright(amountText) {
  return String(amountText ?? "").trim().toLowerCase() === "outright";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

    const name = String(req.query?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "Missing ?name=" });

    const sb = supabaseAdmin();

    // 1) Member (case-insensitive)
    const { data: member, error: memberErr } = await sb
      .from("members")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    if (memberErr) return res.status(400).json({ error: memberErr.message });
    if (!member) return res.status(404).json({ error: "Member not found." });

    // 2) Bonus ledger for this earner (compute totals client-side)
    const { data: bonuses, error: bonusErr } = await sb
      .from("bonus_ledger")
      .select(
        "created_at, earner_name, source_member_name, relative_level, bonus_type, amount_num, amount_text, rule_applied, reason"
      )
      .ilike("earner_name", name)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (bonusErr) return res.status(400).json({ error: bonusErr.message });

    // 3) Redemptions for this member
    const { data: redemptions, error: redErr } = await sb
      .from("redemptions")
      .select("created_at, member_name, redeem_type, qty, source, notes")
      .ilike("member_name", name)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (redErr) return res.status(400).json({ error: redErr.message });

    // --- Totals logic ---
    let total_cash = 0;        // includes outright 600
    let redeemable_cash = 0;   // excludes outright
    let total_product = 0;

    for (const b of bonuses ?? []) {
      const n = Number(b.amount_num ?? 0) || 0;
      if (b.bonus_type === "Cash") {
        total_cash += n;
        if (!isOutright(b.amount_text)) redeemable_cash += n;
      } else if (b.bonus_type === "Product") {
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
