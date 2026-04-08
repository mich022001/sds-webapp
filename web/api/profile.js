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

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const sessionUser = parseSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const accountId = Number(sessionUser.id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return res.status(400).json({ error: "Invalid session account id" });
    }

    if (req.method === "GET") {
      const { data, error } = await sb
        .from("app_accounts")
        .select("id, username, full_name, role, member_id")
        .eq("id", accountId)
        .maybeSingle();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data || null });
    }

    if (req.method === "PUT") {
      const newUsername = normalizeText(req.body?.username);
      const currentPassword = String(req.body?.current_password || "");
      const newPassword = String(req.body?.new_password || "");

      if (!newUsername && !newPassword) {
        return res.status(400).json({
          error: "Provide a new username and/or new password",
        });
      }

      const { data: account, error: accountError } = await sb
        .from("app_accounts")
        .select("id, username, password_hash")
        .eq("id", accountId)
        .maybeSingle();

      if (accountError) {
        return res.status(400).json({ error: accountError.message });
      }

      if (!account?.id) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      const passwordOk = await bcrypt.compare(currentPassword, account.password_hash);
      if (!passwordOk) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const patch = {};

      if (newUsername && newUsername !== account.username) {
        const { data: existingUser, error: usernameError } = await sb
          .from("app_accounts")
          .select("id")
          .eq("username", newUsername)
          .neq("id", accountId)
          .maybeSingle();

        if (usernameError) {
          return res.status(400).json({ error: usernameError.message });
        }

        if (existingUser?.id) {
          return res.status(400).json({ error: "Username is already taken" });
        }

        patch.username = newUsername;
      }

      if (newPassword) {
        if (newPassword.length < 8) {
          return res.status(400).json({
            error: "New password must be at least 8 characters",
          });
        }

        patch.password_hash = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(patch).length === 0) {
        return res.status(200).json({
          ok: true,
          message: "No changes were needed",
        });
      }

      const { data, error } = await sb
        .from("app_accounts")
        .update(patch)
        .eq("id", accountId)
        .select("id, username, full_name, role, member_id")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        ok: true,
        message: "Profile updated successfully",
        data,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
