import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateMemberId() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${year}EM${random}`;
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

    const payload = {
      name,
      member_id: generateMemberId(),      // required
      contact: contact ?? null,
      email: email ?? null,
      membership_type,
      level: 1,                            // required
      address: address ?? null,
      sponsor_name: sponsor ?? null,
      regional_manager: null,
      area_region: area_region ?? null,
      created_at: new Date().toISOString(), // required
    };

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
    return res.status(500).json({
      error: e?.message || "Server error",
    });
  }
}
