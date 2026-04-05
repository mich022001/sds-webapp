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

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "GET only" });
    }

    const sb = supabaseAdmin();

    const receiver = normalizeText(req.query?.receiver);
    const buyer = normalizeText(req.query?.buyer);
    const product = normalizeText(req.query?.product);
    const from = normalizeText(req.query?.from);
    const to = normalizeText(req.query?.to);

    let query = sb
      .from("rm_rebates_ledger")
      .select("*")
      .order("id", { ascending: false });

    if (receiver) query = query.ilike("receiver_name", `%${receiver}%`);
    if (buyer) query = query.ilike("buyer_name", `%${buyer}%`);
    if (product) query = query.ilike("product", `%${product}%`);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      data: Array.isArray(data) ? data : [],
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
