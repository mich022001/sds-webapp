import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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
  if (!secret) throw new Error("Missing SDS_AUTH_SECRET");
  return secret;
}

function parseSessionUser(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.sds_session;
    if (!token) return null;

    const payload = jwt.verify(token, getAuthSecret());

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

function isRestrictedUser(user) {
  return user?.role === "rm" || user?.role === "normal";
}

export default async function handler(req, res) {
  try {
    const sessionUser = parseSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sb = supabaseAdmin();

    if (req.method === "PUT") {
      const { username, current_password, new_password } = req.body ?? {};

      const newUsername = normalizeText(username);
      const currentPassword = String(current_password || "");
      const newPassword = String(new_password || "");

      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      const { data: account, error } = await sb
        .from("app_accounts")
        .select("id, username, password_hash")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const ok = await bcrypt.compare(currentPassword, account.password_hash);
      if (!ok) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const updates = {};

      if (newUsername && newUsername !== account.username) {
        const { data: existingUser, error: usernameError } = await sb
          .from("app_accounts")
          .select("id")
          .eq("username", newUsername)
          .neq("id", sessionUser.id)
          .maybeSingle();

        if (usernameError) {
          return res.status(500).json({ error: usernameError.message });
        }

        if (existingUser?.id) {
          return res.status(400).json({ error: "Username is already taken" });
        }

        updates.username = newUsername;
      }

      if (newPassword) {
        if (newPassword.length < 8) {
          return res.status(400).json({
            error: "Password must be at least 8 characters",
          });
        }

        updates.password_hash = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No changes provided" });
      }

      const { error: updateError } = await sb
        .from("app_accounts")
        .update(updates)
        .eq("id", sessionUser.id);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({
        ok: true,
        message: "Profile updated successfully",
      });
    }

    if (req.method === "POST") {
      const action = normalizeText(req.body?.action).toLowerCase();

      if (action !== "request_password_reset") {
        return res.status(400).json({ error: "Invalid profile action" });
      }

      if (!isRestrictedUser(sessionUser)) {
        return res
          .status(403)
          .json({ error: "Only member or RM accounts can request password reset" });
      }

      if (!sessionUser.member_id) {
        return res
          .status(403)
          .json({ error: "Your account is not linked to a member. Contact admin." });
      }

      const notes = normalizeText(req.body?.notes);

      const { data: account, error: accountError } = await sb
        .from("app_accounts")
        .select("id, username, member_id")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (accountError) {
        return res.status(500).json({ error: accountError.message });
      }

      if (!account?.id || !account.member_id) {
        return res.status(404).json({ error: "Linked account not found" });
      }

      const { data: member, error: memberError } = await sb
        .from("members")
        .select("member_id, name")
        .eq("member_id", account.member_id)
        .maybeSingle();

      if (memberError) {
        return res.status(500).json({ error: memberError.message });
      }

      if (!member?.member_id) {
        return res.status(404).json({ error: "Linked member not found" });
      }

      const { data: existingPending, error: pendingError } = await sb
        .from("password_reset_requests")
        .select("id")
        .eq("account_id", account.id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingError) {
        return res.status(500).json({ error: pendingError.message });
      }

      if (existingPending?.id) {
        return res
          .status(400)
          .json({ error: "You already have a pending password reset request" });
      }

      const { data, error } = await sb
        .from("password_reset_requests")
        .insert([
          {
            account_id: account.id,
            member_id: member.member_id,
            member_name: member.name,
            username: account.username,
            requested_by:
              normalizeText(sessionUser.username) ||
              normalizeText(sessionUser.full_name) ||
              "system",
            notes: notes || null,
            status: "pending",
          },
        ])
        .select("*")
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        ok: true,
        message: "Password reset request submitted successfully",
        data,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({
      error: String(e?.message ?? e),
    });
  }
}
