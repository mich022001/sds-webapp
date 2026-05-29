import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function num(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value, fallback = null) {
  const cleaned = String(value ?? "").trim();
  return cleaned || fallback;
}

function cleanImageUrl(value) {
  const cleaned = String(value ?? "").trim();
  return cleaned || null;
}

function validateItemType(value) {
  const cleaned = String(value ?? "").trim().toLowerCase();

  if (!["product", "package"].includes(cleaned)) {
    return null;
  }

  return cleaned;
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const itemType = String(req.query?.item_type ?? "").trim();
      const activeOnly =
        String(req.query?.active_only ?? "true").trim() !== "false";

      let query = sb
        .from("product_catalog")
        .select("*")
        .order("item_type", { ascending: true })
        .order("item_name", { ascending: true });

      if (itemType) {
        query = query.eq("item_type", itemType);
      }

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      const {
        item_code,
        item_name,
        item_type,
        unit_type,
        srp_price,
        member_price,
        distributor_price,
        stockiest_price,
        image_url,
        is_active,
      } = req.body ?? {};

      const cleanName = cleanText(item_name, "");
      const cleanCode = cleanText(item_code, null);
      const cleanType = validateItemType(item_type);
      const cleanUnit = cleanText(unit_type, "Per Piece");

      if (!cleanName) {
        return res.status(400).json({ error: "item_name is required" });
      }

      if (!cleanType) {
        return res
          .status(400)
          .json({ error: "item_type must be product or package" });
      }

      const { data, error } = await sb
        .from("product_catalog")
        .insert([
          {
            item_code: cleanCode,
            item_name: cleanName,
            item_type: cleanType,
            unit_type: cleanUnit,
            srp_price: num(srp_price),
            member_price: num(member_price),
            distributor_price: num(distributor_price),
            stockiest_price: num(stockiest_price),
            image_url: cleanImageUrl(image_url),
            is_active: is_active !== false,
          },
        ])
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    if (req.method === "PUT") {
      const {
        id,
        item_code,
        item_name,
        item_type,
        unit_type,
        srp_price,
        member_price,
        distributor_price,
        stockiest_price,
        image_url,
        is_active,
      } = req.body ?? {};

      const rowId = Number(id);

      if (!Number.isFinite(rowId) || rowId <= 0) {
        return res.status(400).json({ error: "valid id is required" });
      }

      const payload = {};

      if (item_code !== undefined) {
        payload.item_code = cleanText(item_code, null);
      }

      if (item_name !== undefined) {
        const cleanName = cleanText(item_name, "");

        if (!cleanName) {
          return res.status(400).json({ error: "item_name is required" });
        }

        payload.item_name = cleanName;
      }

      if (item_type !== undefined) {
        const cleanType = validateItemType(item_type);

        if (!cleanType) {
          return res
            .status(400)
            .json({ error: "item_type must be product or package" });
        }

        payload.item_type = cleanType;
      }

      if (unit_type !== undefined) {
        payload.unit_type = cleanText(unit_type, "Per Piece");
      }

      if (srp_price !== undefined) {
        payload.srp_price = num(srp_price);
      }

      if (member_price !== undefined) {
        payload.member_price = num(member_price);
      }

      if (distributor_price !== undefined) {
        payload.distributor_price = num(distributor_price);
      }

      if (stockiest_price !== undefined) {
        payload.stockiest_price = num(stockiest_price);
      }

      if (image_url !== undefined) {
        payload.image_url = cleanImageUrl(image_url);
      }

      if (is_active !== undefined) {
        payload.is_active = !!is_active;
      }

      const { data, error } = await sb
        .from("product_catalog")
        .update(payload)
        .eq("id", rowId)
        .select("*")
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    if (req.method === "DELETE") {
      const rowId = Number(req.query?.id ?? req.body?.id);

      if (!Number.isFinite(rowId) || rowId <= 0) {
        return res.status(400).json({ error: "valid id is required" });
      }

      const { error } = await sb
        .from("product_catalog")
        .delete()
        .eq("id", rowId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: String(error?.message ?? error),
    });
  }
}
