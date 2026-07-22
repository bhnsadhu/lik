import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// supabase-js has no request deadline of its own: a stalled connection leaves
// the awaiting screen on a spinner forever. Every load the UI blocks on races
// against this instead, so a dead network always lands on an error state.
export const REQUEST_TIMEOUT = 15000

export function withTimeout(query, ms = REQUEST_TIMEOUT) {
  return Promise.race([
    // .then() forces the postgrest builder to actually run rather than sit
    // unexecuted while the race resolves
    Promise.resolve(query).then((r) => r),
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'timed out' } }), ms)
    ),
  ])
}
