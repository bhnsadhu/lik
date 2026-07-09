// Anon-surface probe: what can an unauthenticated client see or do?
// Every one of these should be blocked (or empty) if RLS is right.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://axwsjbnhyfklvnexiorx.supabase.co',
  'sb_publishable_XfOT3R9kaQe84LSZ9oBvGw_2COV5w5K'
)

async function probe(label, fn) {
  try {
    const { data, error, count } = await fn()
    console.log(
      label.padEnd(42),
      error ? `BLOCKED (${error.code || ''} ${error.message})` : `rows=${Array.isArray(data) ? data.length : data ? 1 : 0}${count != null ? ` count=${count}` : ''}`
    )
    if (!error && Array.isArray(data) && data.length) {
      console.log('   sample keys:', Object.keys(data[0]).join(', '))
    }
  } catch (e) {
    console.log(label.padEnd(42), 'THREW', e.message)
  }
}

await probe('SELECT profiles', () => supabase.from('profiles').select('*').limit(3))
await probe('SELECT profiles count', () => supabase.from('profiles').select('id', { count: 'exact', head: true }))
await probe('SELECT swipes', () => supabase.from('swipes').select('*').limit(3))
await probe('SELECT matches', () => supabase.from('matches').select('*').limit(3))
await probe('SELECT messages', () => supabase.from('messages').select('*').limit(3))
await probe('SELECT referrals', () => supabase.from('referrals').select('*').limit(3))
await probe('INSERT swipes (forged)', () =>
  supabase.from('swipes').insert({ swiper: '00000000-0000-0000-0000-000000000001', target: '00000000-0000-0000-0000-000000000002', liked: true }).select()
)
await probe('INSERT messages (forged)', () =>
  supabase.from('messages').insert({ match_id: 1, sender: '00000000-0000-0000-0000-000000000001', body: 'x' }).select()
)
await probe('UPDATE profiles (forged)', () =>
  supabase.from('profiles').update({ bio: 'hacked' }).neq('id', '00000000-0000-0000-0000-000000000000').select()
)
await probe('RPC delete_account (anon)', () => supabase.rpc('delete_account'))
await probe('storage list photos root', () => supabase.storage.from('photos').list('', { limit: 3 }).then((r) => ({ data: r.data, error: r.error })))
process.exit(0)
