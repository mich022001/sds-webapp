import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import bcrypt from "bcryptjs";

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

function isPrivileged(user) {
  return user?.role === "admin" || user?.role === "super_admin";
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

async function resolveRegionalManagerForRequest(
  sb,
  sessionUser,
  sponsor,
  requestedRegionalManager,
  membershipType
) {
  const cleanMembershipType = normalizeText(membershipType);
  const cleanRequestedRm = normalizeText(requestedRegionalManager);
  const cleanSponsor = normalizeText(sponsor);

  if (!sessionUser) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated",
    };
  }

  if (cleanMembershipType === "Regional Manager") {
    return {
      ok: true,
      regionalManager: null,
    };
  }

  if (isRestrictedRecruiter(sessionUser)) {
    return {
      ok: true,
      regionalManager: null,
    };
  }

  if (cleanSponsor === "SDS") {
    if (!cleanRequestedRm) {
      return {
        ok: false,
        status: 400,
        error: "Regional Manager is required when sponsor is SDS",
      };
    }

    const { data, error } = await sb
      .from("members")
      .select("name, membership_type")
      .eq("name", cleanRequestedRm)
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
        status: 400,
        error: "Selected Regional Manager does not exist",
      };
    }

    if (
      normalizeText(data.membership_type).toLowerCase() !== "regional manager"
    ) {
      return {
        ok: false,
        status: 400,
        error: "Selected Regional Manager is not a Regional Manager account",
      };
    }

    return {
      ok: true,
      regionalManager: data.name,
    };
  }

  return {
    ok: true,
    regionalManager: null,
  };
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const sessionUser = parseSessionUser(req);
      const mode = normalizeText(req.query?.mode).toLowerCase();
      const memberId = normalizeText(req.query?.member_id);

      if (mode === "password_reset_requests") {
        if (!sessionUser || !isPrivileged(sessionUser)) {
          return res.status(403).json({ error: "Only admin or super admin can view password reset requests" });
        }

        const status = normalizeText(req.query?.status).toLowerCase();
        const search = normalizeText(req.query?.search);

        let query = sb
          .from("password_reset_requests")
          .select("*")
          .order("id", { ascending: false });

        if (status) {
          query = query.eq("status", status);
        }

        if (search) {
          query = query.or(
            `member_name.ilike.%${search}%,username.ilike.%${search}%,member_id.ilike.%${search}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ data: data ?? [] });
      }

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
        .limit(200);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      const sessionUser = parseSessionUser(req);

      if (!sessionUser) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const {
        name,
        contact,
        email,
        membership_type,
        address,
        sponsor,
        regional_manager,
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

      const rmResult = await resolveRegionalManagerForRequest(
        sb,
        sessionUser,
        finalSponsor,
        regional_manager,
        cleanMembershipType
      );

      if (!rmResult.ok) {
        return res
          .status(rmResult.status || 400)
          .json({ error: rmResult.error });
      }

      const finalRegionalManager = rmResult.regionalManager;

      const { data, error } = await sb.rpc("register_member_with_code", {
        p_name: cleanName,
        p_contact: cleanContact || null,
        p_email: cleanEmail || null,
        p_membership_type: cleanMembershipType,
        p_address: cleanAddress || null,
        p_sponsor: finalSponsor,
        p_regional_manager:
          isPrivileged(sessionUser) && finalSponsor === "SDS"
            ? finalRegionalManager
            : null,
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
        regional_manager_used:
          result.regional_manager ??
          (cleanMembershipType === "Regional Manager"
            ? result.name ?? cleanName
            : finalRegionalManager ?? null),
      });
    }

    if (req.method === "PUT") {
      const sessionUser = parseSessionUser(req);

      if (!sessionUser || !isPrivileged(sessionUser)) {
        return res
          .status(403)
          .json({ error: "Only admin or super admin can manage password reset requests" });
      }

      const action = normalizeText(req.body?.action).toLowerCase();
      const requestId = Number(req.body?.request_id);
      const adminNotes = normalizeText(req.body?.admin_notes);

      if (!Number.isFinite(requestId) || requestId <= 0) {
        return res.status(400).json({ error: "Valid request_id is required" });
      }

      if (!["complete_password_reset", "reject_password_reset"].includes(action)) {
        return res.status(400).json({
          error: "action must be complete_password_reset or reject_password_reset",
        });
      }

      const { data: resetRequest, error: requestError } = await sb
        .from("password_reset_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) {
        return res.status(400).json({ error: requestError.message });
      }

      if (!resetRequest?.id) {
        return res.status(404).json({ error: "Password reset request not found" });
      }

      if (normalizeText(resetRequest.status).toLowerCase() !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending requests can be processed" });
      }

      const actor =
        normalizeText(sessionUser.username) ||
        normalizeText(sessionUser.full_name) ||
        "admin";
      const now = new Date().toISOString();

      if (action === "reject_password_reset") {
        const { data, error } = await sb
          .from("password_reset_requests")
          .update({
            status: "rejected",
            admin_notes: adminNotes || null,
            rejected_by: actor,
            rejected_at: now,
          })
          .eq("id", requestId)
          .select("*")
          .single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({
          ok: true,
          message: "Password reset request rejected",
          data,
        });
      }

      const resetPasswordValue = normalizeText(resetRequest.member_id);
      if (!resetPasswordValue) {
        return res
          .status(400)
          .json({ error: "Request has no member_id for reset target" });
      }

      const passwordHash = await bcrypt.hash(resetPasswordValue, 10);

      const { error: accountUpdateError } = await sb
        .from("app_accounts")
        .update({ password_hash: passwordHash })
        .eq("id", resetRequest.account_id);

      if (accountUpdateError) {
        return res.status(400).json({ error: accountUpdateError.message });
      }

      const { data, error } = await sb
        .from("password_reset_requests")
        .update({
          status: "completed",
          admin_notes: adminNotes || null,
          completed_by: actor,
          completed_at: now,
        })
        .eq("id", requestId)
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        ok: true,
        message: "Password reset completed. Password is now the member ID.",
        data,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
