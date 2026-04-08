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

function normalizeText(v) {
  return String(v || "").trim();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

function isRestrictedUser(user) {
  return user?.role === "rm" || user?.role === "normal";
}

function isAdminUser(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function getPricingBasis(membershipType) {
  const mt = normalizeText(membershipType).toLowerCase();

  if (mt === "stockiest") return "Stockiest";
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return "Distributor";
  }
  if (mt === "member") return "Member";
  return "SRP";
}

function getUnitPrice(itemRow, membershipType) {
  if (!itemRow) return 0;

  const mt = normalizeText(membershipType).toLowerCase();

  if (mt === "stockiest") return num(itemRow.stockiest_price);
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return num(itemRow.distributor_price);
  }
  if (mt === "member") return num(itemRow.member_price);

  return num(itemRow.srp_price);
}

function getSaleStatus({ itemType, sessionUser }) {
  const cleanItemType = normalizeText(itemType).toLowerCase();

  // Registration packages should be automatically approved
  if (cleanItemType === "package") {
    return "approved";
  }

  // Regular products by RM / normal need approval
  if (cleanItemType === "product" && isRestrictedUser(sessionUser)) {
    return "pending";
  }

  // Admin / super admin sales are auto-approved
  return "approved";
}

async function resolveMemberContext(sb, sessionUser, body) {
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

  if (isRestrictedUser(sessionUser)) {
    if (!sessionUser.member_id) {
      return {
        ok: false,
        status: 403,
        error: "Your account is not linked to a member. Contact admin.",
      };
    }

    const { data, error } = await sb
      .from("members")
      .select("member_id, name, membership_type, regional_manager")
      .eq("member_id", sessionUser.member_id)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        status: 400,
        error: error.message,
      };
    }

    if (!data?.member_id) {
      return {
        ok: false,
        status: 403,
        error: "Linked member record was not found. Contact admin.",
      };
    }

    return {
      ok: true,
      member: data,
    };
  }

  const requestedMemberId = normalizeText(body?.member_id);
  const requestedMemberName = normalizeText(body?.member_name);

  if (!requestedMemberId && !requestedMemberName) {
    return {
      ok: false,
      status: 400,
      error: "member_id or member_name is required",
    };
  }

  let query = sb
    .from("members")
    .select("member_id, name, membership_type, regional_manager");

  if (requestedMemberId) {
    query = query.eq("member_id", requestedMemberId);
  } else {
    query = query.eq("name", requestedMemberName);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 400,
      error: error.message,
    };
  }

  if (!data?.member_id) {
    return {
      ok: false,
      status: 400,
      error: "Selected member was not found",
    };
  }

  return {
    ok: true,
    member: data,
  };
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();
    const sessionUser = parseSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.method === "POST") {
      const memberResult = await resolveMemberContext(
        sb,
        sessionUser,
        req.body ?? {}
      );

      if (!memberResult.ok) {
        return res
          .status(memberResult.status || 400)
          .json({ error: memberResult.error });
      }

      const member = memberResult.member;
      const { item_id, quantity } = req.body ?? {};

      const itemId = Number(item_id);
      const qty = Math.max(1, Math.floor(num(quantity)));

      if (!Number.isFinite(itemId) || itemId <= 0) {
        return res.status(400).json({ error: "item_id is required" });
      }

      if (qty < 1) {
        return res.status(400).json({ error: "quantity must be at least 1" });
      }

      const { data: itemRow, error: itemError } = await sb
        .from("product_catalog")
        .select(
          "id, item_name, item_type, unit_type, srp_price, member_price, distributor_price, stockiest_price, is_active"
        )
        .eq("id", itemId)
        .eq("is_active", true)
        .maybeSingle();

      if (itemError) {
        return res.status(400).json({ error: itemError.message });
      }

      if (!itemRow?.id) {
        return res.status(400).json({ error: "Selected item was not found" });
      }

      const membershipType = normalizeText(member.membership_type) || "Member";
      const itemType = normalizeText(itemRow.item_type).toLowerCase();
      const unitType =
        normalizeText(itemRow.unit_type) ||
        (itemType === "package" ? "Package" : "Per Piece");
      const pricingBasis = getPricingBasis(membershipType);
      const unitPrice = getUnitPrice(itemRow, membershipType);
      const totalAmount = unitPrice * qty;
      const status = getSaleStatus({
        itemType,
        sessionUser,
      });

      const actor =
        normalizeText(sessionUser.username) ||
        normalizeText(sessionUser.full_name) ||
        "system";

      const payload = {
        created_at: new Date().toISOString(),
        member_name: normalizeText(member.name),
        member_id: normalizeText(member.member_id),
        membership_type: membershipType,
        regional_manager: normalizeText(member.regional_manager) || null,
        item_type: itemType,
        product_name: normalizeText(itemRow.item_name),
        unit_type: unitType,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: totalAmount,
        pricing_basis: pricingBasis,
        encoded_by: actor,
        requested_by_username: isRestrictedUser(sessionUser) ? actor : null,
        status,
      };

      const { data, error } = await sb
        .from("sales_ledger")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        ok: true,
        message:
          status === "pending"
            ? "Sale request submitted successfully."
            : "Sale saved successfully.",
        data,
      });
    }

    if (req.method === "PUT") {
      if (!isAdminUser(sessionUser)) {
        return res
          .status(403)
          .json({ error: "Only admin or super admin can approve sales" });
      }

      const id = Number(req.body?.id);
      const action = normalizeText(req.body?.action).toLowerCase();

      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: "Valid sale id is required" });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "action must be approve or reject" });
      }

      const { data: existing, error: existingError } = await sb
        .from("sales_ledger")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (existingError) {
        return res.status(400).json({ error: existingError.message });
      }

      if (!existing?.id) {
        return res.status(404).json({ error: "Sale record not found" });
      }

      const currentStatus = normalizeText(existing.status).toLowerCase();

      if (currentStatus !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending sales can be updated" });
      }

      const patch = {
        status: action === "approve" ? "approved" : "rejected",
      };

      const { data, error } = await sb
        .from("sales_ledger")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        ok: true,
        message:
          action === "approve"
            ? "Sale approved successfully."
            : "Sale rejected successfully.",
        data,
      });
    }

    if (req.method === "GET") {
      const from = normalizeText(req.query?.from);
      const to = normalizeText(req.query?.to);
      const buyer = normalizeText(req.query?.buyer);
      const product = normalizeText(req.query?.product);
      const itemType = normalizeText(req.query?.item_type);
      const status = normalizeText(req.query?.status);

      let query = sb.from("sales_ledger").select("*").order("id", {
        ascending: false,
      });

      if (isRestrictedUser(sessionUser)) {
        if (!sessionUser.member_id) {
          return res.status(403).json({
            error: "Your account is not linked to a member. Contact admin.",
          });
        }

        query = query.eq("member_id", sessionUser.member_id);
      } else {
        if (buyer) query = query.ilike("member_name", `%${buyer}%`);
      }

      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);
      if (product) query = query.ilike("product_name", `%${product}%`);
      if (itemType) query = query.eq("item_type", itemType);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
