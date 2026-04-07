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

function normalizeText(v) {
  return String(v || "").trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isRestrictedUser(user) {
  return user?.role === "rm" || user?.role === "normal";
}

function isAdminUser(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

async function getLinkedMember(sb, sessionUser) {
  if (!sessionUser?.member_id) {
    return { ok: false, status: 403, error: "Your account is not linked to a member. Contact admin." };
  }

  const { data, error } = await sb
    .from("members")
    .select("member_id, name, membership_type, regional_manager")
    .eq("member_id", sessionUser.member_id)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 400, error: error.message };
  }

  if (!data?.member_id) {
    return { ok: false, status: 403, error: "Linked member record was not found. Contact admin." };
  }

  return { ok: true, member: data };
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const sessionUser = parseSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.method === "GET") {
      const status = normalizeText(req.query?.status).toLowerCase();
      const redeemType = normalizeText(req.query?.redeem_type);
      const memberName = normalizeText(req.query?.member_name);

      let query = sb
        .from("redemptions")
        .select("*")
        .order("id", { ascending: false });

      if (isRestrictedUser(sessionUser)) {
        const linked = await getLinkedMember(sb, sessionUser);
        if (!linked.ok) {
          return res.status(linked.status || 400).json({ error: linked.error });
        }

        query = query.eq("member_id", linked.member.member_id);
      } else {
        if (memberName) {
          query = query.ilike("member_name", `%${memberName}%`);
        }
      }

      if (status) query = query.eq("status", status);
      if (redeemType) query = query.eq("redeem_type", redeemType);

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      if (!isRestrictedUser(sessionUser) && !isAdminUser(sessionUser)) {
        return res.status(403).json({ error: "You are not allowed to submit redemptions" });
      }

      const linked = await getLinkedMember(sb, sessionUser);
      if (!linked.ok) {
        return res.status(linked.status || 400).json({ error: linked.error });
      }

      const member = linked.member;

      const redeemType = normalizeText(req.body?.redeem_type);
      const qty = toNumber(req.body?.qty);
      const notes = normalizeText(req.body?.notes);

      if (!redeemType) {
        return res.status(400).json({ error: "redeem_type is required" });
      }

      if (!["Cash", "Product"].includes(redeemType)) {
        return res.status(400).json({ error: "redeem_type must be Cash or Product" });
      }

      if (qty <= 0) {
        return res.status(400).json({ error: "qty must be greater than 0" });
      }

      const payload = {
        created_at: new Date().toISOString(),
        member_name: member.name,
        member_id: member.member_id,
        membership_type: member.membership_type,
        regional_manager: normalizeText(member.regional_manager) || null,
        redeem_type: redeemType,
        qty,
        status: "pending",
        notes: notes || null,
        requested_by: normalizeText(sessionUser.username) || normalizeText(sessionUser.full_name) || "system",
        requested_at: new Date().toISOString(),
      };

      const { data, error } = await sb
        .from("redemptions")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "PUT") {
      if (!isAdminUser(sessionUser)) {
        return res.status(403).json({ error: "Only admin or super admin can update redemption status" });
      }

      const id = Number(req.body?.id);
      const action = normalizeText(req.body?.action).toLowerCase();
      const adminNotes = normalizeText(req.body?.admin_notes);

      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: "Valid redemption id is required" });
      }

      if (!["approve", "release", "reject"].includes(action)) {
        return res.status(400).json({ error: "action must be approve, release, or reject" });
      }

      const { data: existing, error: existingError } = await sb
        .from("redemptions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (existingError) {
        return res.status(400).json({ error: existingError.message });
      }

      if (!existing?.id) {
        return res.status(404).json({ error: "Redemption record not found" });
      }

      const currentStatus = normalizeText(existing.status).toLowerCase();

      if (action === "approve" && currentStatus !== "pending") {
        return res.status(400).json({ error: "Only pending redemption can be approved" });
      }

      if (action === "release" && !["pending", "approved"].includes(currentStatus)) {
        return res.status(400).json({ error: "Only pending or approved redemption can be released" });
      }

      if (action === "reject" && !["pending", "approved"].includes(currentStatus)) {
        return res.status(400).json({ error: "Only pending or approved redemption can be rejected" });
      }

      const now = new Date().toISOString();
      const actor =
        normalizeText(sessionUser.username) ||
        normalizeText(sessionUser.full_name) ||
        "admin";

      const patch = {
        admin_notes: adminNotes || existing.admin_notes || null,
      };

      if (action === "approve") {
        patch.status = "approved";
        patch.approved_at = now;
        patch.approved_by = actor;
      }

      if (action === "release") {
        patch.status = "released";
        patch.released_at = now;
        patch.released_by = actor;

        if (!existing.approved_at) {
          patch.approved_at = now;
          patch.approved_by = actor;
        }
      }

      if (action === "reject") {
        patch.status = "rejected";
        patch.rejected_at = now;
        patch.rejected_by = actor;
      }

      const { data, error } = await sb
        .from("redemptions")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ ok: true, data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
