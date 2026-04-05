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

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sb = supabaseAdmin();
    const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

    const { data: ledgerRows, error: ledgerError } = await sb
      .from("bonus_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ledgerError) {
      return res.status(500).json({ error: ledgerError.message });
    }

    const { data: members, error: membersError } = await sb
      .from("members")
      .select("member_id, name");

    if (membersError) {
      return res.status(500).json({ error: membersError.message });
    }

    const memberIdByName = new Map();
    for (const row of members || []) {
      const key = norm(row.name);
      if (key && !memberIdByName.has(key)) {
        memberIdByName.set(key, row.member_id || "");
      }
    }

    const data = (ledgerRows || []).map((row) => ({
      ...row,
      earner_member_id:
        row.earner_member_id ||
        memberIdByName.get(norm(row.earner_name)) ||
        "",
    }));

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
