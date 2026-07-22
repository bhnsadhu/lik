// Keeps the Supabase project awake during App Review.
//
// Free-tier Supabase projects pause after a stretch of inactivity. A review
// can sit in the queue for days, and a paused backend makes every request in
// the app fail at once - the app looks completely broken through no fault of
// the build. A daily request counts as activity and prevents that.
//
// This is a safety net, not a substitute for the Pro plan: see REVIEW_NOTES.md.

const URL_ = process.env.REACT_APP_SUPABASE_URL
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (!URL_ || !KEY) {
    res.status(500).json({ ok: false, error: 'supabase env vars missing' })
    return
  }

  const started = Date.now()
  try {
    // HEAD against a real table: touches Postgres rather than just the gateway
    const r = await fetch(`${URL_}/rest/v1/profiles?select=id&limit=1`, {
      method: 'HEAD',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    const ok = r.status < 500
    res.status(ok ? 200 : 503).json({
      ok,
      status: r.status,
      ms: Date.now() - started,
      at: new Date().toISOString(),
    })
  } catch (e) {
    res.status(503).json({ ok: false, error: String(e), ms: Date.now() - started })
  }
}
