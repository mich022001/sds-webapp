import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

function getSecret() {
  if (!process.env.SDS_AUTH_SECRET) {
    throw new Error("Missing SDS_AUTH_SECRET");
  }
  return process.env.SDS_AUTH_SECRET;
}

function normalizeText(v) {
  return String(v || "").trim();
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const isProd = process.env.NODE_ENV === "production";

    // =========================================
    // ✅ SESSION CHECK
    // =========================================
    if (req.method === "GET") {
      try {
        const cookies = cookie.parse(req.headers.cookie || "");
        const token = cookies.sds_session;

        if (!token) {
          return res.status(200).json({ user: null });
        }

        const payload = jwt.verify(token, getSecret());

        return res.status(200).json({
          user: {
            username: payload.username,
            role: payload.role,
            member_id: payload.member_id,
          },
        });
      } catch {
        return res.status(200).json({ user: null });
      }
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const action = normalizeText(req.body?.action);

    // =========================================
    // 🚪 LOGOUT
    // =========================================
    if (action === "logout") {
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("sds_session", "", {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: isProd,
          expires: new Date(0),
        })
      );

      return res.status(200).json({ ok: true });
    }

    // =========================================
    // 🔥 FORGOT PASSWORD (USERNAME ONLY)
    // =========================================
    if (action === "request_password_reset") {
      const username = normalizeText(req.body?.username);

      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const { data: account, error: accErr } = await sb
        .from("app_accounts")
        .select("id, username, member_id")
        .eq("username", username)
        .maybeSingle();

      if (accErr) {
        return res.status(500).json({ error: accErr.message });
      }

      if (!account) {
        return res.status(404).json({ error: "Username not found" });
      }

      if (!account.member_id) {
        return res.status(400).json({
          error: "Account is not linked to a member. Contact admin.",
        });
      }

      const { data: existingPending, error: pendingErr } = await sb
        .from("password_reset_requests")
        .select("id")
        .eq("account_id", account.id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingErr) {
        return res.status(500).json({ error: pendingErr.message });
      }

      if (existingPending?.id) {
        return res.status(400).json({
          error:
            "You already have a pending password reset request. Please contact admin.",
        });
      }

      const { data: member, error: memberErr } = await sb
        .from("members")
        .select("member_id, name")
        .eq("member_id", account.member_id)
        .maybeSingle();

      if (memberErr) {
        return res.status(500).json({ error: memberErr.message });
      }

      const { error: insertErr } = await sb.from("password_reset_requests").insert([
        {
          account_id: account.id,
          username: account.username,
          member_id: member?.member_id || account.member_id,
          member_name: member?.name || "",
          requested_by: account.username,
          status: "pending",
        },
      ]);

      if (insertErr) {
        const msg = String(insertErr.message || "").toLowerCase();

        if (msg.includes("duplicate") || msg.includes("unique")) {
          return res.status(400).json({
            error:
              "You already have a pending password reset request. Please contact admin.",
          });
        }

        return res.status(500).json({ error: insertErr.message });
      }

      return res.status(200).json({
        ok: true,
        message:
          "Request submitted. Please contact admin and wait for your password to be reset to your Member ID.",
      });
    }

    // =========================================
    // 🔐 LOGIN
    // =========================================
    const username = normalizeText(req.body?.username);
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const { data: account, error } = await sb
      .from("app_accounts")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!account) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, account.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: account.id,
        username: account.username,
        role: account.role,
        member_id: account.member_id,
      },
      getSecret(),
      { expiresIn: "7d" }
    );

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sds_session", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 7,
      })
    );

    return res.status(200).json({
      ok: true,
      user: {
        username: account.username,
        role: account.role,
        member_id: account.member_id,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
