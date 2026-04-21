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

function norm(v) {
  return normalizeText(v).toLowerCase();
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
  const mt = norm(membershipType);

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

  const mt = norm(membershipType);

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

function getActor(sessionUser) {
  return (
    normalizeText(sessionUser?.username) ||
    normalizeText(sessionUser?.full_name) ||
    "system"
  );
}

function getInitialSaleStatus({ sessionUser, saleContext }) {
  const cleanContext = norm(saleContext);

  // Registration flow is automatically completed
  if (cleanContext === "registration") {
    return "released";
  }

  // Admin / super admin manual entries are already completed
  if (isAdminUser(sessionUser)) {
    return "released";
  }

  // RM / normal manual sales need approval
  if (isRestrictedUser(sessionUser)) {
    return "pending";
  }

  return "approved";
}

/* =========================
   COMPENSATION RULES
========================= */

const SALE_COMP_RULES = {
  "vigomaxx": { rm: 20, am: 10, group1: 4 },
  "compact c": { rm: 15, am: 10, group1: 4 },
  "prommix plus": { rm: 10, am: 5, group1: 4 },
  "balatinaw coffee": { rm: 5, am: 3, group1: 2 },
  "zepamax": { rm: 10, am: 6, group1: 4 },
};

function getCompensationRule(productName, unitType, saleContext) {
  const cleanContext = norm(saleContext);
  const cleanUnitType = norm(unitType);
  const cleanProduct = norm(productName);

  // No compensation for registration sales
  if (cleanContext === "registration") return null;

  // No compensation for package sales
  if (cleanUnitType === "package" || cleanUnitType === "per set") return null;

  return SALE_COMP_RULES[cleanProduct] || null;
}

/* =========================
   HIERARCHY HELPERS
========================= */

async function getMemberByName(sb, name) {
  const cleanName = normalizeText(name);
  if (!cleanName) return null;

  const { data, error } = await sb
    .from("members")
    .select(
      "member_id, name, membership_type, regional_manager, sponsor_name"
    )
    .eq("name", cleanName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

async function getMemberById(sb, memberId) {
  const cleanId = normalizeText(memberId);
  if (!cleanId) return null;

  const { data, error } = await sb
    .from("members")
    .select(
      "member_id, name, membership_type, regional_manager, sponsor_name"
    )
    .eq("member_id", cleanId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

async function findFirstAreaManagerInSponsorChain(sb, sponsorName) {
  let currentSponsor = normalizeText(sponsorName);
  const visited = new Set();

  while (currentSponsor && norm(currentSponsor) !== "sds") {
    const key = norm(currentSponsor);
    if (visited.has(key)) break;
    visited.add(key);

    const row = await getMemberByName(sb, currentSponsor);
    if (!row?.name) return null;

    if (norm(row.membership_type) === "area manager") {
      return row;
    }

    currentSponsor = normalizeText(row.sponsor_name);
  }

  return null;
}

/* =========================
   COMPENSATION INSERTS
========================= */

async function insertRmRebateIfMissing(sb, {
  createdAt,
  receiverName,
  buyerName,
  productName,
  qty,
  unitType,
  rebate,
}) {
  if (!receiverName || rebate <= 0) return;

  const { data: existingRows, error: existingError } = await sb
    .from("rm_rebates_ledger")
    .select("id")
    .eq("receiver_name", receiverName)
    .eq("buyer_name", buyerName)
    .eq("product", productName)
    .eq("qty", qty)
    .eq("unit_type", unitType)
    .eq("rebate", rebate)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    return;
  }

  const { error: insertError } = await sb.from("rm_rebates_ledger").insert([
    {
      created_at: createdAt,
      receiver_name: receiverName,
      buyer_name: buyerName,
      product: productName,
      qty,
      unit_type: unitType,
      rebate,
    },
  ]);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function insertAmRebateIfMissing(sb, {
  createdAt,
  receiverName,
  buyerName,
  productName,
  qty,
  unitType,
  rebate,
}) {
  if (!receiverName || rebate <= 0) return;

  const { data: existingRows, error: existingError } = await sb
    .from("am_rebates_ledger")
    .select("id")
    .eq("receiver_name", receiverName)
    .eq("buyer_name", buyerName)
    .eq("product", productName)
    .eq("qty", qty)
    .eq("unit_type", unitType)
    .eq("rebate", rebate)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    return;
  }

  const { error: insertError } = await sb.from("am_rebates_ledger").insert([
    {
      created_at: createdAt,
      receiver_name: receiverName,
      buyer_name: buyerName,
      product: productName,
      qty,
      unit_type: unitType,
      rebate,
    },
  ]);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function insertGroupSalesBonusIfMissing(sb, {
  createdAt,
  receiverName,
  buyerName,
  productName,
  qty,
  unitType,
  bonus,
}) {
  if (!receiverName || bonus <= 0) return;

  const { data: existingRows, error: existingError } = await sb
    .from("group_sales_bonus_ledger")
    .select("id")
    .eq("receiver_name", receiverName)
    .eq("buyer_name", buyerName)
    .eq("product", productName)
    .eq("qty", qty)
    .eq("unit_type", unitType)
    .eq("bonus", bonus)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    return;
  }

  const { error: insertError } = await sb
    .from("group_sales_bonus_ledger")
    .insert([
      {
        created_at: createdAt,
        receiver_name: receiverName,
        buyer_name: buyerName,
        product: productName,
        qty,
        unit_type: unitType,
        bonus,
      },
    ]);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

/* =========================
   MAIN COMPENSATION PROCESSOR
========================= */

async function createSaleCompensationsIfEligible(sb, saleRow) {
  const saleContext = normalizeText(saleRow?.sale_context) || "manual_sale";
  const buyerName = normalizeText(saleRow?.member_name);
  const buyerMemberId = normalizeText(saleRow?.member_id);
  const productName = normalizeText(saleRow?.product_name);
  const unitType = normalizeText(saleRow?.unit_type) || "Per Piece";
  const qty = num(saleRow?.quantity);
  const createdAt =
    normalizeText(saleRow?.released_at) ||
    normalizeText(saleRow?.created_at) ||
    new Date().toISOString();

  const rule = getCompensationRule(productName, unitType, saleContext);
  if (!rule) return;

  const buyer =
    (buyerMemberId && (await getMemberById(sb, buyerMemberId))) ||
    (buyerName && (await getMemberByName(sb, buyerName)));

  if (!buyer?.name) return;

  const buyerMembershipType = norm(buyer.membership_type);
  const buyerRegionalManager = normalizeText(buyer.regional_manager);
  const directSponsorName = normalizeText(buyer.sponsor_name);

  // 1. RM rebate
  if (
    buyerRegionalManager &&
    norm(buyerRegionalManager) !== norm(buyer.name) &&
    buyerMembershipType !== "regional manager"
  ) {
    await insertRmRebateIfMissing(sb, {
      createdAt,
      receiverName: buyerRegionalManager,
      buyerName: buyer.name,
      productName,
      qty,
      unitType,
      rebate: num(rule.rm) * qty,
    });
  }

  // 2. AM rebate (first AM in sponsor chain; skip if none)
  if (directSponsorName && norm(directSponsorName) !== "sds") {
    const areaManager = await findFirstAreaManagerInSponsorChain(
      sb,
      directSponsorName
    );

    if (
      areaManager?.name &&
      norm(areaManager.name) !== norm(buyer.name)
    ) {
      await insertAmRebateIfMissing(sb, {
        createdAt,
        receiverName: areaManager.name,
        buyerName: buyer.name,
        productName,
        qty,
        unitType,
        rebate: num(rule.am) * qty,
      });
    }
  }

  // 3. Group sales bonus = direct sponsor only
  if (
    directSponsorName &&
    norm(directSponsorName) !== "sds" &&
    norm(directSponsorName) !== norm(buyer.name)
  ) {
    await insertGroupSalesBonusIfMissing(sb, {
      createdAt,
      receiverName: directSponsorName,
      buyerName: buyer.name,
      productName,
      qty,
      unitType,
      bonus: num(rule.group1) * qty,
    });
  }
}

/* =========================
   MEMBER CONTEXT
========================= */

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
      .select(
        "member_id, name, membership_type, regional_manager, sponsor_name"
      )
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
    .select(
      "member_id, name, membership_type, regional_manager, sponsor_name"
    );

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

/* =========================
   API HANDLER
========================= */

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
      const saleContext =
        normalizeText(req.body?.sale_context) || "manual_sale";

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
      const itemType = norm(itemRow.item_type);
      const unitType =
        normalizeText(itemRow.unit_type) ||
        (itemType === "package" ? "Package" : "Per Piece");
      const pricingBasis = getPricingBasis(membershipType);
      const unitPrice = getUnitPrice(itemRow, membershipType);
      const totalAmount = unitPrice * qty;

      const status = getInitialSaleStatus({
        sessionUser,
        saleContext,
      });

      const actor = getActor(sessionUser);
      const now = new Date().toISOString();

      const payload = {
        created_at: now,
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
        sale_context: saleContext,
        status,
        approved_at: null,
        approved_by: null,
        paid_at: null,
        paid_by: null,
        released_at: null,
        released_by: null,
        rejected_at: null,
        rejected_by: null,
        cancelled_at: null,
        cancelled_by: null,
        cancel_reason: null,
      };

      if (status === "approved") {
        payload.approved_at = now;
        payload.approved_by = actor;
      }

      if (status === "released") {
        payload.approved_at = now;
        payload.approved_by = actor;
        payload.paid_at = now;
        payload.paid_by = actor;
        payload.released_at = now;
        payload.released_by = actor;
      }

      const { data, error } = await sb
        .from("sales_ledger")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (norm(data?.status) === "released") {
        await createSaleCompensationsIfEligible(sb, data);
      }

      return res.status(200).json({
        ok: true,
        message:
          status === "pending"
            ? "Sale request submitted successfully."
            : status === "approved"
              ? "Sale saved and approved successfully."
              : "Sale saved and released successfully.",
        data,
      });
    }

    if (req.method === "PUT") {
      const id = Number(req.body?.id);
      const action = norm(req.body?.action);
      const cancelReason = normalizeText(req.body?.cancel_reason);

      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: "Valid sale id is required" });
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

      const currentStatus = norm(existing.status);
      const actor = getActor(sessionUser);
      const now = new Date().toISOString();

      if (action === "cancel") {
        if (!isRestrictedUser(sessionUser)) {
          return res.status(403).json({
            error: "Only RM or normal users can cancel their own pending sales",
          });
        }

        if (normalizeText(existing.member_id) !== normalizeText(sessionUser.member_id)) {
          return res.status(403).json({
            error: "You can only cancel your own sale requests",
          });
        }

        if (currentStatus !== "pending") {
          return res.status(400).json({
            error: "Only pending sales can be cancelled",
          });
        }

        if (!cancelReason) {
          return res.status(400).json({
            error: "Cancel reason is required",
          });
        }

        const patch = {
          status: "cancelled",
          cancelled_at: now,
          cancelled_by: actor,
          cancel_reason: cancelReason,
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
          message: "Sale request cancelled successfully.",
          data,
        });
      }

      if (!isAdminUser(sessionUser)) {
        return res
          .status(403)
          .json({ error: "Only admin or super admin can update sales" });
      }

      if (!["approve", "reject", "paid", "release"].includes(action)) {
        return res.status(400).json({
          error: "action must be approve, reject, paid, release, or cancel",
        });
      }

      const patch = {};

      if (action === "approve") {
        if (currentStatus !== "pending") {
          return res
            .status(400)
            .json({ error: "Only pending sales can be approved" });
        }

        patch.status = "approved";
        patch.approved_at = now;
        patch.approved_by = actor;
      }

      if (action === "reject") {
        if (!["pending", "approved", "paid"].includes(currentStatus)) {
          return res.status(400).json({
            error: "Only pending, approved, or paid sales can be rejected",
          });
        }

        patch.status = "rejected";
        patch.rejected_at = now;
        patch.rejected_by = actor;
      }

      if (action === "paid") {
        if (currentStatus !== "approved") {
          return res
            .status(400)
            .json({ error: "Only approved sales can be marked as paid" });
        }

        patch.status = "paid";
        patch.paid_at = now;
        patch.paid_by = actor;
      }

      if (action === "release") {
        if (!["approved", "paid"].includes(currentStatus)) {
          return res.status(400).json({
            error: "Only approved or paid sales can be released",
          });
        }

        patch.status = "released";
        patch.released_at = now;
        patch.released_by = actor;

        if (!existing.approved_at) {
          patch.approved_at = now;
          patch.approved_by = actor;
        }

        if (!existing.paid_at) {
          patch.paid_at = now;
          patch.paid_by = actor;
        }
      }

      const { data, error } = await sb
        .from("sales_ledger")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (action === "release") {
        await createSaleCompensationsIfEligible(sb, data);
      }

      return res.status(200).json({
        ok: true,
        message:
          action === "approve"
            ? "Sale approved successfully."
            : action === "reject"
              ? "Sale rejected successfully."
              : action === "paid"
                ? "Sale marked as paid successfully."
                : "Sale released successfully.",
        data,
      });
    }

    if (req.method === "GET") {
      const from = normalizeText(req.query?.from);
      const to = normalizeText(req.query?.to);
      const buyer = normalizeText(req.query?.buyer);
      const product = normalizeText(req.query?.product);
      const itemType = normalizeText(req.query?.item_type);
      const status = norm(req.query?.status);

      let query = sb
        .from("sales_ledger")
        .select("*")
        .order("id", { ascending: false });

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

      if (status === "queue") {
        if (!isAdminUser(sessionUser)) {
          return res.status(403).json({ error: "Admin only" });
        }

        query = query.in("status", ["pending", "approved", "paid"]);
      } else if (status) {
        query = query.eq("status", status);
      }

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
