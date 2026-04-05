import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function makeCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SDSREG-${out}`;
}

async function generateUniqueCodes(sb, qty) {
  const codes = [];
  const seen = new Set();

  while (codes.length < qty) {
    const candidate = makeCode();

    if (seen.has(candidate)) continue;
    seen.add(candidate);

    const { data, error } = await sb
      .from("registration_codes")
      .select("id")
      .ilike("code", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      codes.push(candidate);
    }
  }

  return codes;
}

export default async function handler(req, res) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const status = String(req.query?.status ?? "").trim().toLowerCase();
      const search = String(req.query?.search ?? "").trim();

      let query = sb
        .from("registration_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (status === "used") query = query.eq("is_used", true);
      if (status === "unused") query = query.eq("is_used", false);
      if (status === "active") query = query.eq("is_active", true);
      if (status === "inactive") query = query.eq("is_active", false);

      if (search) {
        query = query.or(
          [
            `code.ilike.%${search}%`,
            `used_by_member_id.ilike.%${search}%`,
            `used_by_member_name.ilike.%${search}%`,
            `sponsor_name.ilike.%${search}%`,
            `recruited_by_name.ilike.%${search}%`,
          ].join(",")
        );
      }

      const { data, error } = await query;
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === "POST") {
      const mode = String(req.body?.mode ?? "single").trim().toLowerCase();

      if (mode === "single") {
        const manualCode = String(req.body?.code ?? "").trim().toUpperCase();
        const finalCode = manualCode || makeCode();

        const { data, error } = await sb
          .from("registration_codes")
          .insert([
            {
              code: finalCode,
              is_active: true,
              is_used: false,
            },
          ])
          .select("*")
          .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json({ data });
      }

      if (mode === "bulk") {
        const qty = Number(req.body?.quantity ?? 0);
        if (!Number.isFinite(qty) || qty < 1 || qty > 500) {
          return res.status(400).json({ error: "quantity must be between 1 and 500" });
        }

        const codes = await generateUniqueCodes(sb, qty);

        const payload = codes.map((code) => ({
          code,
          is_active: true,
          is_used: false,
        }));

        const { data, error } = await sb
          .from("registration_codes")
          .insert(payload)
          .select("*");

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json({ data: data ?? [] });
      }

      return res.status(400).json({ error: "invalid mode" });
    }

    if (req.method === "PUT") {
      const { id, is_active } = req.body ?? {};
      const rowId = Number(id);

      if (!Number.isFinite(rowId) || rowId <= 0) {
        return res.status(400).json({ error: "valid id is required" });
      }

      const { data: existing, error: fetchError } = await sb
        .from("registration_codes")
        .select("id, is_used, is_active")
        .eq("id", rowId)
        .maybeSingle();

      if (fetchError) {
        return res.status(400).json({ error: fetchError.message });
      }

      if (!existing) {
        return res.status(404).json({ error: "Registration code not found" });
      }

      if (existing.is_used) {
        return res.status(400).json({
          error: "Used registration codes cannot be reactivated or modified",
        });
      }

      const { data, error } = await sb
        .from("registration_codes")
        .update({
          is_active: !!is_active,
        })
        .eq("id", rowId)
        .select("*")
        .single();

      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
