import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
