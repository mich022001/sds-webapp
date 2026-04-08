import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { Resend } from "resend";
import crypto from "crypto";

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

function buildSessionCookie(token) {
  return cookie.serialize("sds_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function buildLogoutCookie() {
  return cookie.serialize("sds_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || "").trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  const proto =
    req.headers["x-forwarded-proto"] ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";

  return `${proto}://${host}`;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return new Resend(apiKey);
}

function getSenderEmail() {
  const sender = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!sender) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }
  return sender;
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0] || null;
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim() || null;
  }
  return req.socket?.remoteAddress || null;
}

async function handleForgotPassword(req, res) {
  const { username } = req.body ?? {};
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername) {
    return res.status(400).json({ error: "Username is required" });
  }

  const sb = supabaseAdmin();

  const { data: account, error: accountError } = await sb
    .from("app_accounts")
    .select("id, username, member_id, is_active")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (accountError) {
    return res.status(500).json({ error: accountError.message });
  }

  if (!account || !account.is_active) {
    return res.status(200).json({
      ok: true,
      message: "If the account exists, a reset link has been sent.",
    });
  }

  if (!account.member_id) {
    return res.status(200).json({
      ok: true,
      message: "If the account exists, a reset link has been sent.",
    });
  }

  const { data: member, error: memberError } = await sb
    .from("members")
    .select("email, name")
    .eq("member_id", account.member_id)
    .maybeSingle();

  if (memberError) {
    return res.status(500).json({ error: memberError.message });
  }

  if (!member?.email) {
    return res.status(200).json({
      ok: true,
      message: "If the account exists, a reset link has been sent.",
    });
  }

  const { error: invalidateError } = await sb
    .from("password_resets")
    .update({ invalidated: true })
    .eq("account_id", account.id)
    .eq("used", false)
    .eq("invalidated", false);

  if (invalidateError) {
    return res.status(500).json({ error: invalidateError.message });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await sb.from("password_resets").insert({
    account_id: account.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    requested_ip: getRequestIp(req),
  });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  const baseUrl = getBaseUrl(req);
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;

  const resend = getResendClient();
  const sender = getSenderEmail();

  const emailResult = await resend.emails.send({
    from: sender,
    to: member.email,
    subject: "Reset your SDS password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Hello${member.name ? ` ${member.name}` : ""},</p>
        <p>We received a request to reset your SDS account password.</p>
        <p>
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
            Click here to reset your password
          </a>
        </p>
        <p>This link will expire in 15 minutes and can only be used once.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (emailResult?.error) {
    return res
      .status(500)
      .json({ error: emailResult.error.message || "Failed to send email" });
  }

  return res.status(200).json({
    ok: true,
    message: "If the account exists, a reset link has been sent.",
  });
}

async function handleResetPassword(req, res) {
  const { token, newPassword } = req.body ?? {};
  const cleanToken = String(token || "").trim();
  const cleanPassword = String(newPassword || "");

  if (!cleanToken || !cleanPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  if (cleanPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const sb = supabaseAdmin();
  const tokenHash = sha256(cleanToken);

  const { data: resetRow, error: resetError } = await sb
    .from("password_resets")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .eq("invalidated", false)
    .maybeSingle();

  if (resetError) {
    return res.status(500).json({ error: resetError.message });
  }

  if (!resetRow) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  if (Number(resetRow.attempt_count || 0) >= 5) {
    return res
      .status(400)
      .json({ error: "Too many attempts for this reset link" });
  }

  const now = Date.now();
  const expiresAt = new Date(resetRow.expires_at).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt < now) {
    await sb
      .from("password_resets")
      .update({ invalidated: true })
      .eq("id", resetRow.id);

    return res.status(400).json({ error: "Token expired" });
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 10);

  const { error: accountUpdateError } = await sb
    .from("app_accounts")
    .update({ password_hash: passwordHash })
    .eq("id", resetRow.account_id);

  if (accountUpdateError) {
    await sb
      .from("password_resets")
      .update({
        attempt_count: Number(resetRow.attempt_count || 0) + 1,
      })
      .eq("id", resetRow.id);

    return res.status(500).json({ error: accountUpdateError.message });
  }

  const usedAt = new Date().toISOString();

  const { error: markUsedError } = await sb
    .from("password_resets")
    .update({
      used: true,
      used_at: usedAt,
    })
    .eq("id", resetRow.id);

  if (markUsedError) {
    return res.status(500).json({ error: markUsedError.message });
  }

  const { error: invalidateOthersError } = await sb
    .from("password_resets")
    .update({ invalidated: true })
    .eq("account_id", resetRow.account_id)
    .eq("used", false)
    .eq("invalidated", false);

  if (invalidateOthersError) {
    return res.status(500).json({ error: invalidateOthersError.message });
  }

  return res.status(200).json({
    ok: true,
    message: "Password updated successfully",
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const secret = getAuthSecret();
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies.sds_session;

      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      try {
        const payload = jwt.verify(token, secret);

        return res.status(200).json({
          user: {
            id: payload.sub,
            username: payload.username,
            full_name: payload.full_name,
            role: payload.role,
            member_id: payload.member_id ?? null,
          },
        });
      } catch {
        return res.status(401).json({ error: "Not authenticated" });
      }
    }

    if (req.method === "POST") {
      const action = String(req.body?.action ?? "").trim().toLowerCase();

      if (action === "logout") {
        res.setHeader("Set-Cookie", buildLogoutCookie());
        return res.status(200).json({ ok: true });
      }

      if (action === "login") {
        const { username, password } = req.body ?? {};

        const cleanUsername = String(username ?? "").trim();
        const cleanPassword = String(password ?? "");

        if (!cleanUsername || !cleanPassword) {
          return res
            .status(400)
            .json({ error: "Username and password are required" });
        }

        const sb = supabaseAdmin();

        const { data: account, error } = await sb
          .from("app_accounts")
          .select(
            "id, username, password_hash, full_name, role, member_id, is_active"
          )
          .eq("username", cleanUsername)
          .maybeSingle();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        if (!account) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        if (!account.is_active) {
          return res.status(403).json({ error: "Account is inactive" });
        }

        const ok = await bcrypt.compare(cleanPassword, account.password_hash);
        if (!ok) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        const secret = getAuthSecret();

        const token = jwt.sign(
          {
            sub: String(account.id),
            username: account.username,
            role: account.role,
            full_name: account.full_name ?? "",
            member_id: account.member_id ?? null,
          },
          secret,
          { expiresIn: "7d" }
        );

        res.setHeader("Set-Cookie", buildSessionCookie(token));

        return res.status(200).json({
          ok: true,
          user: {
            id: account.id,
            username: account.username,
            full_name: account.full_name,
            role: account.role,
            member_id: account.member_id ?? null,
          },
        });
      }

      if (action === "forgot_password") {
        return await handleForgotPassword(req, res);
      }

      if (action === "reset_password") {
        return await handleResetPassword(req, res);
      }

      return res.status(400).json({ error: "Invalid auth action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({
      error: String(e?.message ?? e),
      name: e?.name || null,
    });
  }
}
