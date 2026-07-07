import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { scoreProfiles } from '../lib/compatibility'
import { avatarUrl } from '../lib/avatar'
import PersonSheet from '../components/PersonSheet'

export default function Chat() {
  const { matchId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [other, setOther] = useState(null)
  const [msgs, setMsgs] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const scrollRef = useRef(null)

  const appendUnique = useCallback((msg) => {
    setMsgs((cur) => {
      if (!cur || cur.some((m) => m.id === msg.id)) return cur
      return [...cur, msg]
    })
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
      if (!match) {
        navigate('/matches')
        return
      }
      const otherId = match.user_a === user.id ? match.user_b : match.user_a
      const [{ data: person }, { data: messages }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherId).single(),
        supabase.from('messages').select('*').eq('match_id', matchId).order('created_at'),
      ])
      setOther(person)
      setMsgs(messages || [])
    })()
  }, [matchId, user.id, navigate])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => appendUnique(payload.new)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, appendUnique])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs])

  async function send(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setDraft('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: Number(matchId), sender: user.id, body })
      .select()
      .single()
    if (error) {
      setDraft(body)
    } else {
      appendUnique(data)
    }
    setSending(false)
  }

  return (
    <div className="chat-screen">
      <div className="chat-head">
        <button aria-label="Back" onClick={() => navigate('/matches')} style={{ fontSize: 22, color: 'var(--muted)', padding: '0 4px' }}>
          &#8249;
        </button>
        <button
          className="chat-head__person"
          aria-label={other ? `View ${other.name}'s profile` : 'View profile'}
          disabled={!other}
          onClick={() => setShowProfile(true)}
        >
          {avatarUrl(other) && <img src={avatarUrl(other)} alt={other.name} />}
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17 }}>{other?.name || ''}</span>
        </button>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {!msgs ? (
          <div className="empty"><div className="spin" /></div>
        ) : msgs.length === 0 ? (
          <div className="empty">
            <h2>It's a lik. Now what?</h2>
            <p>Open strong. Ask about their thermostat stance. Mention the quiz answer you share. Anything beats hey.</p>
          </div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`bubble ${m.sender === user.id ? 'bubble--me' : 'bubble--them'}`}>
              {m.body}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showProfile && other && profile && (
          <PersonSheet
            person={other}
            fit={scoreProfiles(profile, other)}
            friend={null}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>

      <form className="chat-input-row" onSubmit={send}>
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={other ? `Message ${other.name}` : 'Message'}
          maxLength={2000}
        />
        <button className="chat-send" type="submit" disabled={!draft.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  )
}
