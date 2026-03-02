import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normStr(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const name = normStr(body.name);
    const contact = normStr(body.contact);
    const email = normStr(body.email);
    const membership_type = normStr(body.membership_type);
    const address = normStr(body.address);
    const sponsorRaw = normStr(body.sponsor);
    const area_region = normStr(body.area_region);

    // Required checks (same idea as Apps Script)
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!membership_type) {
      return res.status(400).json({ error: "Membership type is required" });
    }

    // Sponsor rules (same as Apps Script):
    // - empty => no sponsor
    // - "SDS"  => treat as root / no sponsor
    const sponsor =
      sponsorRaw && sponsorRaw.toUpperCase() === "SDS" ? null : sponsorRaw;

    /**
     * register_member MUST implement the Apps Script behavior ATOMICALLY:
     * - sequential member_id (YYYYEM000001) concurrency-safe (use member_counters / row lock)
     * - duplicate name check
     * - sponsor lookup + throw "Sponsor not found." if missing
     * - level calculation
     * - regional_manager assignment rules
     * - promote sponsor Member -> Distributor when eligible
     * - bonus distribution up to 7 uplines with duplicate protection
     * - update member_bonus_summary (Members_Bonuses equivalent)
     *
     * Recommended: have register_member RETURN the created member row
     * (and optionally how many ledger rows were inserted).
     */
    const { data, error } = await supabase.rpc("register_member", {
      p_name: name,
      p_contact: contact,
      p_email: email,
      p_membership_type: membership_type,
      p_address: address,
      p_sponsor: sponsor, // null means SDS/root
      p_area_region: area_region,
    });

    if (error) {
      // If your DB function raises exceptions like:
      // "This member is already registered." / "Sponsor not found."
      // then returning 400 is correct.
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
