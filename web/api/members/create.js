import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function yearPrefix() {
  const year = new Date().getFullYear();
  return `${year}EM`;
}

function nextMemberIdFromLast(lastId, prefix) {
  // lastId example: "2026EM000123"
  if (!lastId || typeof lastId !== "string" || !lastId.startsWith(prefix)) {
    return `${prefix}000001`;
  }

  const lastNumStr = lastId.slice(prefix.length); // "000123"
  const lastNum = parseInt(lastNumStr, 10);
  const nextNum = Number.isFinite(lastNum) ? lastNum + 1 : 1;

  return `${prefix}${String(nextNum).padStart(6, "0")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      contact,
      email,
      membership_type,
      address,
      sponsor,
      area_region,
    } = req.body || {};

    if (!name || !membership_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prefix = yearPrefix();

    // 1) Fetch latest member_id for THIS YEAR
    // Order by member_id descending works because it's fixed-width numeric suffix.
    const { data: lastRow, error: lastErr } = await supabase
      .from("members")
      .select("member_id")
      .like("member_id", `${prefix}%`)
      .order("member_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      return res.status(500).json({ error: lastErr.message });
    }

    const newMemberId = nextMemberIdFromLast(lastRow?.member_id, prefix);

    const payload = {
      name,
      member_id: newMemberId,
      contact: contact ?? null,
      email: email ?? null,
      membership_type,
      level: 1,
      address: address ?? null,
      sponsor_name: sponsor ?? null,
      regional_manager: null,
      area_region: area_region ?? null,
      created_at: new Date().toISOString(),
    };

    // 2) Insert
    const { data, error } = await supabase
      .from("members")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
