import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import cookie from "cookie";

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

function getAuthSecret() {
  const secret = process.env.SDS_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing SDS_AUTH_SECRET");
  }
  return secret;
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

function parseSessionUser(req) {
  try {
    const secret = getAuthSecret();
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.sds_session;

    if (!token) return null;

    const payload = jwt.verify(token, secret);

    return {
      id: payload.sub,
      username: payload.username,
      full_name: payload.full_name,
      role: payload.role,
      member_id: payload.member_id ?? null,
    };
  } catch {
    return null;
  }
}

function isRestrictedRecruiter(user) {
  return user?.role === "rm" || user?.role === "normal";
}

async function resolveSponsorForRequest(sb, req, requestedSponsor) {
  const sessionUser = parseSessionUser(req);

  if (!sessionUser) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated",
    };
  }

  if (!sessionUser.role) {
    return {
      ok: false,
      status: 403,
      error: "Account role is missing",
    };
  }

  if (isRestrictedRecruiter(sessionUser)) {
    if (!sessionUser.member_id) {
      return {
        ok: false,
        status: 403,
        error: "Your account is not linked to a member. Contact admin.",
      };
    }

    const { data, error } = await sb
      .from("members")
      .select("member_id, name")
      .eq("member_id", sessionUser.member_id)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        status: 400,
        error: error.message,
      };
    }

    if (!data?.name) {
      return {
        ok: false,
        status: 403,
        error: "Linked member record was not found. Contact admin.",
      };
    }

    return {
      ok: true,
      sponsor: data.name,
      sessionUser,
      linkedMember: data,
    };
  }

  const cleanSponsor = normalizeText(requestedSponsor);

  if (!cleanSponsor || cleanSponsor.toUpperCase() === "SDS") {
    return {
      ok: true,
      sponsor: "SDS",
      sessionUser,
      linkedMember: null,
    };
  }

  const { data: sponsorRow, error: sponsorError } = await sb
    .from("members")
    .select("name")
    .eq("name", cleanSponsor)
    .maybeSingle();

  if (sponsorError) {
    return {
      ok: false,
      status: 400,
      error: sponsorError.message,
    };
  }

  if (!sponsorRow?.name) {
    return {
      ok: false,
      status: 400,
      error: "Sponsor does not exist",
    };
  }

  return {
    ok: true,
    sponsor: sponsorRow.name,
    sessionUser,
    linkedMember: sponsorRow,
  };
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

      const sponsorResult = await resolveSponsorForRequest(sb, req, sponsor);

      if (!sponsorResult.ok) {
        return res
          .status(sponsorResult.status || 400)
          .json({ error: sponsorResult.error });
      }

      const finalSponsor = sponsorResult.sponsor;

      const { data, error } = await sb.rpc("register_member_with_code", {
        p_name: cleanName,
        p_contact: cleanContact || null,
        p_email: cleanEmail || null,
        p_membership_type: cleanMembershipType,
        p_address: cleanAddress || null,
        p_sponsor: finalSponsor,
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
        sponsor_used: finalSponsor,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
