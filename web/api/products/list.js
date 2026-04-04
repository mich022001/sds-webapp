import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "GET only" });
    }

    const sb = supabaseAdmin();
    const itemType = String(req.query?.item_type ?? "").trim();
    const activeOnly = String(req.query?.active_only ?? "true").trim() !== "false";

    let query = sb
      .from("product_catalog")
      .select("*")
      .order("item_type", { ascending: true })
      .order("item_name", { ascending: true });

    if (itemType) query = query.eq("item_type", itemType);
    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ data: data ?? [] });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
