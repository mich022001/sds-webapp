export default function handler(req, res) {
  res.status(200).json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAdminSecret: !!process.env.ADMIN_SECRET,
    node: process.version,
  });
}
