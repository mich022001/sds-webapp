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
      item_code,
      item_name,
      item_type,
      unit_type,
      srp_price,
      distributor_price,
      stockiest_price,
      is_active,
    } = req.body ?? {};

    const cleanName = String(item_name ?? "").trim();
    const cleanCode = String(item_code ?? "").trim() || null;
    const cleanType = String(item_type ?? "").trim().toLowerCase();
    const cleanUnit = String(unit_type ?? "").trim() || "Per Piece";

    if (!cleanName) {
      return res.status(400).json({ error: "item_name is required" });
    }

    if (!["product", "package"].includes(cleanType)) {
      return res.status(400).json({ error: "item_type must be product or package" });
    }

    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("product_catalog")
      .insert([
        {
          item_code: cleanCode,
          item_name: cleanName,
          item_type: cleanType,
          unit_type: cleanUnit,
          srp_price: num(srp_price),
          distributor_price: num(distributor_price),
          stockiest_price: num(stockiest_price),
          is_active: is_active !== false,
        },
      ])
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
