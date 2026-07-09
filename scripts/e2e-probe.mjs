// Probe: can we create a test account with password signup (no email confirm)?
import { createClient } from '@supabase/supabase-js'

const url = 'https://axwsjbnhyfklvnexiorx.supabase.co'
const anon = 'sb_publishable_XfOT3R9kaQe84LSZ9oBvGw_2COV5w5K'

const supabase = createClient(url, anon)

const email = `lik-e2e-a-${Date.now()}@illinois.edu`
const { data, error } = await supabase.auth.signUp({ email, password: 'lik-e2e-Passw0rd!' })
console.log('signUp error:', error?.message ?? null)
console.log('user:', data?.user?.id ?? null, 'confirmed:', data?.user?.email_confirmed_at ?? null)
console.log('session:', data?.session ? 'YES' : 'NO')

if (data?.session) {
  const { data: prof, error: pErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
  console.log('profile row:', pErr?.message ?? JSON.stringify(prof, null, 2))
}
