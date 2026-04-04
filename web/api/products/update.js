import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const {
      id,
      item_code,
      item_name,
      item_type,
      unit_type,
      srp_price,
      distributor_price,
      stockiest_price,
      is_active,
    } = req.body ?? {};

    const rowId = Number(id);
    if (!Number.isFinite(rowId) || rowId <= 0) {
      return res.status(400).json({ error: "valid id is required" });
    }

    const payload = {};

    if (item_code !== undefined) payload.item_code = String(item_code ?? "").trim() || null;
    if (item_name !== undefined) payload.item_name = String(item_name ?? "").trim();
    if (item_type !== undefined) {
      const t = String(item_type ?? "").trim().toLowerCase();
      if (!["product", "package"].includes(t)) {
        return res.status(400).json({ error: "item_type must be product or package" });
      }
      payload.item_type = t;
    }
    if (unit_type !== undefined) payload.unit_type = String(unit_type ?? "").trim() || "Per Piece";
    if (srp_price !== undefined) payload.srp_price = num(srp_price);
    if (distributor_price !== undefined) payload.distributor_price = num(distributor_price);
    if (stockiest_price !== undefined) payload.stockiest_price = num(stockiest_price);
    if (is_active !== undefined) payload.is_active = !!is_active;

    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("product_catalog")
      .update(payload)
      .eq("id", rowId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
