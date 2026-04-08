import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { token, newPassword } = req.body ?? {};
    const cleanToken = String(token || "").trim();
    const cleanPassword = String(newPassword || "");

    if (!cleanToken || !cleanPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
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
      return res.status(400).json({ error: "Too many attempts for this reset link" });
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

    // Invalidate any other remaining active reset tokens for the same account
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
  } catch (e) {
    return res.status(500).json({
      error: String(e?.message ?? e),
    });
  }
}
