import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

    const { data, error } = await supabase
      .from("bonus_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ data: data || [] });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
