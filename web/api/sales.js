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

function normalizeText(v) {
  return String(v || "").trim();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeRmRebate(productName, unitType, qty) {
  if (unitType === "Package") return qty * 15;
  if (productName === "Balatinaw Coffee") return qty * 5;
  if (productName === "Promix Juice") return qty * 10;
  if (productName === "Compact C") return qty * 20;
  if (productName === "Vigomaxx") return qty * 30;
  if (productName === "Zepamacs") return qty * 10;
  return 0;
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "POST") {
      const {
        member_name,
        member_id,
        membership_type,
        regional_manager,
        product_name,
        unit_type,
        quantity,
        unit_price,
        total_amount,
        pricing_basis,
        encoded_by,
      } = req.body ?? {};

      const cleanMemberName = normalizeText(member_name);
      const cleanMemberId = normalizeText(member_id);
      const cleanMembershipType = normalizeText(membership_type);
      const cleanRegionalManager = normalizeText(regional_manager);
      const cleanProductName = normalizeText(product_name);
      const cleanUnitType = normalizeText(unit_type) || "Per Piece";
      const cleanPricingBasis = normalizeText(pricing_basis) || "SRP";
      const cleanEncodedBy = normalizeText(encoded_by) || "admin";

      const qty = Math.max(1, Math.floor(num(quantity)));
      const price = num(unit_price);
      const total = num(total_amount);

      if (!cleanMemberName) {
        return res.status(400).json({ error: "member_name is required" });
      }

      if (!cleanMemberId) {
        return res.status(400).json({ error: "member_id is required" });
      }

      if (!cleanMembershipType) {
        return res.status(400).json({ error: "membership_type is required" });
      }

      if (!cleanProductName) {
        return res.status(400).json({ error: "product_name is required" });
      }

      if (qty < 1) {
        return res.status(400).json({ error: "quantity must be at least 1" });
      }

      const payload = {
        created_at: new Date().toISOString(),
        member_name: cleanMemberName,
        member_id: cleanMemberId,
        membership_type: cleanMembershipType,
        regional_manager: cleanRegionalManager || null,
        product_name: cleanProductName,
        unit_type: cleanUnitType,
        quantity: qty,
        unit_price: price,
        total_amount: total,
        pricing_basis: cleanPricingBasis,
        encoded_by: cleanEncodedBy,
      };

      const { data, error } = await sb
        .from("sales_ledger")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // ===== RM rebate logic =====
      const { data: memberRow, error: memberError } = await sb
        .from("members")
        .select("regional_manager")
        .eq("member_id", cleanMemberId)
        .maybeSingle();

      if (!memberError && memberRow?.regional_manager) {
        const rmName = normalizeText(memberRow.regional_manager);
        const rebate = computeRmRebate(cleanProductName, cleanUnitType, qty);

        if (rmName && rebate > 0) {
          const { error: rebateError } = await sb
            .from("rm_rebates_ledger")
            .insert([
              {
                created_at: new Date().toISOString(),
                receiver_name: rmName,
                buyer_name: cleanMemberName,
                product: cleanProductName,
                qty,
                unit_type: cleanUnitType,
                rebate,
              },
            ]);

          if (rebateError) {
            console.error("RM rebate insert failed:", rebateError.message);
          }
        }
      }

      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "GET") {
      const from = normalizeText(req.query?.from);
      const to = normalizeText(req.query?.to);
      const buyer = normalizeText(req.query?.buyer);
      const product = normalizeText(req.query?.product);

      let query = sb
        .from("sales_ledger")
        .select("*")
        .order("id", { ascending: false });

      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);
      if (buyer) query = query.ilike("member_name", `%${buyer}%`);
      if (product) query = query.ilike("product_name", `%${product}%`);

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
