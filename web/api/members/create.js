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

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function normalizeText(v) {
  return String(v || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const sb = supabaseAdmin();

    const {
      name,
      contact,
      email,
      membership_type,
      address,
      sponsor,
      area_region,
      package_name,
      registration_code,
    } = req.body ?? {};

    const cleanName = normalizeText(name);
    const cleanContact = normalizeText(contact);
    const cleanEmail = normalizeText(email);
    const cleanMembershipType = normalizeText(membership_type) || "Member";
    const cleanAddress = normalizeText(address);
    const cleanSponsor = normalizeText(sponsor) || "SDS";
    const cleanAreaRegion = normalizeText(area_region);
    const cleanPackageName = normalizeText(package_name);
    const cleanCode = normalizeCode(registration_code);

    if (!cleanName) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!cleanMembershipType) {
      return res.status(400).json({ error: "Membership type is required" });
    }

    if (!cleanPackageName) {
      return res.status(400).json({ error: "Package is required" });
    }

    if (!cleanCode) {
      return res.status(400).json({ error: "Registration code is required" });
    }

    const { data, error } = await sb.rpc("register_member_with_code", {
      p_name: cleanName,
      p_contact: cleanContact || null,
      p_email: cleanEmail || null,
      p_membership_type: cleanMembershipType,
      p_address: cleanAddress || null,
      p_sponsor: cleanSponsor,
      p_area_region: cleanAreaRegion || null,
      p_package_name: cleanPackageName,
      p_code: cleanCode,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      member: data,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
