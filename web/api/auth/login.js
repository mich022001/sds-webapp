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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { username, password } = req.body ?? {};

    const cleanUsername = String(username ?? "").trim();
    const cleanPassword = String(password ?? "");

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const sb = supabaseAdmin();
    console.log("LOGIN_DEBUG", {
      hasUsername: !!cleanUsername,
      hasPassword: !!cleanPassword,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAuthSecret: !!process.env.SDS_AUTH_SECRET,
    });

    const { data: account, error } = await sb
      .from("app_accounts")
      .select("id, username, password_hash, full_name, role, is_active")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!account) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!account.is_active) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const ok = await bcrypt.compare(cleanPassword, account.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const secret = process.env.SDS_AUTH_SECRET;
    if (!secret) {
      throw new Error("Missing SDS_AUTH_SECRET");
    }

    const token = jwt.sign(
      {
        sub: String(account.id),
        username: account.username,
        role: account.role,
        full_name: account.full_name ?? "",
      },
      secret,
      { expiresIn: "7d" }
    );

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sds_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    );

    return res.status(200).json({
      ok: true,
      user: {
        id: account.id,
        username: account.username,
        full_name: account.full_name,
        role: account.role,
      },
    });
  } catch (e) {
    console.error("LOGIN_API_ERROR:", e);
    return res.status(500).json({
      error: String(e?.message ?? e),
      name: e?.name || null,
    });
  }
}
