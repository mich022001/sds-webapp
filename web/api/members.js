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

function extractMemberRow(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === "object") return data;
  return null;
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const memberId = normalizeText(req.query?.member_id);

      if (memberId) {
        const { data, error } = await sb
          .from("members")
          .select(
            "member_id, name, membership_type, sponsor_name, regional_manager, created_at, package_name, level, contact, email, address, area_region"
          )
          .eq("member_id", memberId)
          .maybeSingle();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({
          data: data ? [data] : [],
        });
      }

      const { data, error } = await sb
        .from("members")
        .select(
          "member_id, name, membership_type, sponsor_name, regional_manager, created_at, package_name"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
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

      const result = extractMemberRow(data) || {};

      return res.status(200).json({
        ok: true,
        member: {
          member_id: result.member_id ?? null,
          name: result.name ?? cleanName,
        },
        account_created: result.account_created === true,
        account_username: result.account_username ?? null,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
