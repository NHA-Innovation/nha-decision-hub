// Pre-signup allowlist check. Replaces the old client-side anon read of
// dhub.allowed_users (removed 2026-06-11 when anon read policies were dropped).
// Leaks only a boolean "is this email pre-approved", which the old public
// policy already exposed in full.
export default async function handler(req, res) {
  const email = (req.query.email || '').toString().trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ allowed: false, error: 'invalid email' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ allowed: false, error: 'server misconfigured' });
  }

  try {
    const url = `${supabaseUrl}/rest/v1/allowed_users?email=eq.${encodeURIComponent(email)}&select=email&limit=1`;
    const r = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Accept-Profile': 'dhub',
      },
    });
    const rows = await r.json();
    return res.status(200).json({ allowed: Array.isArray(rows) && rows.length > 0 });
  } catch {
    return res.status(500).json({ allowed: false, error: 'lookup failed' });
  }
}
