import { createClient } from "@supabase/supabase-js";
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

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || "").trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  const proto =
    req.headers["x-forwarded-proto"] ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";

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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

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

    // Generic success response to avoid account enumeration
    if (!account || !account.is_active) {
      return res.status(200).json({
        ok: true,
        message: "If the account exists, a reset link has been sent.",
      });
    }

    // Current system derives email from linked member
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

    // Invalidate older active tokens for this account
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
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

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
      return res.status(500).json({ error: emailResult.error.message || "Failed to send email" });
    }

    return res.status(200).json({
      ok: true,
      message: "If the account exists, a reset link has been sent.",
    });
  } catch (e) {
    return res.status(500).json({
      error: String(e?.message ?? e),
    });
  }
}
