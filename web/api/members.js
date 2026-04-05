import { createClient } from "@supabase/supabase-js";

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

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function normalizeText(v) {
  return String(v || "").trim();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractMemberRow(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === "object") return data;
  return null;
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

function getUnitPrice(productRow, membershipType) {
  if (!productRow) return 0;

  const mt = normalizeText(membershipType).toLowerCase();

  if (mt === "stockiest") return num(productRow.stockiest_price);
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return num(productRow.distributor_price);
  }
  if (mt === "member") return num(productRow.member_price);

  return num(productRow.srp_price);
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const { data, error } = await sb
        .from("members")
        .select(
          "member_id, name, membership_type, sponsor_name, regional_manager, created_at, package_name"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      const {
        name,
        contact,
        email,
        membership_type,
        address,
        sponsor,
        area_region,
        package_name,
        registration_code,
      } = req.body ?? {};

      const cleanName = normalizeText(name);
      const cleanContact = normalizeText(contact);
      const cleanEmail = normalizeText(email);
      const cleanMembershipType = normalizeText(membership_type) || "Member";
      const cleanAddress = normalizeText(address);
      const cleanSponsor = normalizeText(sponsor) || "SDS";
      const cleanAreaRegion = normalizeText(area_region);
      const cleanPackageName = normalizeText(package_name);
      const cleanCode = normalizeCode(registration_code);

      if (!cleanName) {
        return res.status(400).json({ error: "Name is required" });
      }

      if (!cleanMembershipType) {
        return res.status(400).json({ error: "Membership type is required" });
      }

      if (!cleanPackageName) {
        return res.status(400).json({ error: "Package is required" });
      }

      if (!cleanCode) {
        return res.status(400).json({ error: "Registration code is required" });
      }

      const { data: packageRow, error: packageError } = await sb
        .from("product_catalog")
        .select(
          "id, item_name, item_type, unit_type, srp_price, member_price, distributor_price, stockiest_price, is_active"
        )
        .eq("item_name", cleanPackageName)
        .eq("item_type", "package")
        .eq("is_active", true)
        .maybeSingle();

      if (packageError) {
        return res.status(400).json({ error: packageError.message });
      }

      if (!packageRow) {
        return res.status(400).json({
          error: "Selected package is invalid or inactive",
        });
      }

      const { data, error } = await sb.rpc("register_member_with_code", {
        p_name: cleanName,
        p_contact: cleanContact || null,
        p_email: cleanEmail || null,
        p_membership_type: cleanMembershipType,
        p_address: cleanAddress || null,
        p_sponsor: cleanSponsor,
        p_area_region: cleanAreaRegion || null,
        p_package_name: cleanPackageName,
        p_code: cleanCode,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const member = extractMemberRow(data);

      if (!member?.member_id) {
        return res.status(500).json({
          error: "Member was created but could not be loaded for package sale recording",
        });
      }

      const pricingBasis = getPricingBasis(cleanMembershipType);
      const unitPrice = getUnitPrice(packageRow, cleanMembershipType);
      const quantity = 1;
      const totalAmount = unitPrice * quantity;

      const regionalManager =
        normalizeText(member.regional_manager) ||
        normalizeText(member.regionalManager) ||
        null;

      const { error: salesError } = await sb.from("sales_ledger").insert([
        {
          created_at: new Date().toISOString(),
          member_name: cleanName,
          member_id: member.member_id,
          membership_type: cleanMembershipType,
          regional_manager: regionalManager,
          product_name: cleanPackageName,
          unit_type: normalizeText(packageRow.unit_type) || "Per Package",
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          pricing_basis: pricingBasis,
          encoded_by: "admin",
        },
      ]);

      if (salesError) {
        return res.status(400).json({
          error: `Member registered but package sale was not recorded: ${salesError.message}`,
        });
      }

      return res.status(200).json({
        ok: true,
        member,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
