import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'
import { avatarUrl } from '../lib/avatar'

export default function Matches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)

  const load = useCallback(async () => {
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!matches?.length) {
      setRows([])
      return
    }

    const otherIds = matches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a))
    const matchIds = matches.map((m) => m.id)
    const [{ data: people }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('id, name, photos, profile_pic_url').in('id', otherIds),
      supabase
        .from('messages')
        .select('match_id, sender, body, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false }),
    ])

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
        .filter((r) => r.person)
    )
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

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

      {!rows ? (
        <div className="empty"><div className="spin" /></div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h2>No liks yet.</h2>
          <p>Keep swiping. When someone liks you back, they land here and the conversation starts.</p>
        </div>
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
