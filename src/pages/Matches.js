import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, withTimeout } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'
import { avatarUrl } from '../lib/avatar'
import EmptyState, { LoadError } from '../components/EmptyState'

export default function Matches() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const myHousing = profile?.housing_type

  const load = useCallback(async () => {
    const { data: matches, error } = await withTimeout(
      supabase
        .from('matches')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false })
    )

    // "no liks yet" and "we couldn't load your liks" are very different things
    // to be told; never show the first when the second happened
    if (error) {
      setLoadError(true)
      setRows(null)
      return
    }
    setLoadError(false)

    if (!matches?.length) {
      setRows([])
      return
    }

    const otherIds = matches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a))
    const matchIds = matches.map((m) => m.id)
    const [peopleRes, msgRes] = await Promise.all([
      withTimeout(supabase.from('profiles').select('id, name, photos, profile_pic_url, housing_type').in('id', otherIds)),
      withTimeout(
        supabase
          .from('messages')
          .select('match_id, sender, body, created_at')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false })
      ),
    ])

    if (peopleRes.error) {
      setLoadError(true)
      setRows(null)
      return
    }

    const { data: people } = peopleRes
    const { data: msgs } = msgRes
    const personById = Object.fromEntries((people || []).map((p) => [p.id, p]))
    const lastByMatch = {}
    for (const m of msgs || []) {
      if (!lastByMatch[m.match_id]) lastByMatch[m.match_id] = m
    }

    setRows(
      matches
        .map((m) => ({
          id: m.id,
          person: personById[m.user_a === user.id ? m.user_b : m.user_a],
          last: lastByMatch[m.id] || null,
        }))
        // Display filter only, never a delete: a match shows if and only if
        // both people currently share a housing type. A cross-pool match (one
        // side switched dorm<->apartment) disappears from the list but keeps
        // all its messages, and returns untouched the moment the types line up
        // again. Because myHousing is a load dependency, switching pools
        // re-runs this and the list re-filters on its own.
        .filter((r) => r.person && r.person.housing_type === myHousing)
    )
  }, [user.id, myHousing])

  useEffect(() => {
    load()
  }, [load])

  async function retryLoad() {
    setRetrying(true)
    await load()
    setRetrying(false)
  }

  useEffect(() => {
    const channel = supabase
      .channel('matches-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.new.user_a === user.id || payload.new.user_b === user.id) load()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, load])

  return (
    <div className="screen">
      <Wordmark />
      <h2 className="screen-title">Your liks</h2>
      <p className="screen-sub">Mutual only. Everyone here already said yes to you.</p>

      {loadError ? (
        <LoadError
          title="Can't load your liks right now"
          message="Nothing has been lost. Check your connection and give it another go."
          onRetry={retryLoad}
          retrying={retrying}
        />
      ) : !rows ? (
        <div className="empty"><div className="spin" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          mark="spark"
          title="No liks yet."
          message="Keep swiping. When someone liks you back, they land here and the conversation starts."
        />
      ) : (
        <div>
          {rows.map((r) => (
            <button key={r.id} className="match-row" onClick={() => navigate(`/chat/${r.id}`)}>
              {avatarUrl(r.person) ? (
                <img src={avatarUrl(r.person)} alt={r.person.name} />
              ) : (
                <div style={{ width: 58, height: 58, borderRadius: 18, background: 'var(--ink-3)' }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div className="match-row__name">{r.person.name}</div>
                <div className="match-row__preview">
                  {r.last
                    ? `${r.last.sender === user.id ? 'You: ' : ''}${r.last.body}`
                    : 'New lik · Say something'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
