import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase, withTimeout } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { scoreProfiles } from '../lib/compatibility'
import { avatarUrl } from '../lib/avatar'
import PersonSheet from '../components/PersonSheet'
import EmptyState, { LoadError } from '../components/EmptyState'

export default function Chat() {
  const { matchId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [other, setOther] = useState(null)
  const [msgs, setMsgs] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [sendErr, setSendErr] = useState('')
  const scrollRef = useRef(null)

  const appendUnique = useCallback((msg) => {
    setMsgs((cur) => {
      if (!cur || cur.some((m) => m.id === msg.id)) return cur
      return [...cur, msg]
    })
  }, [])

  // Full refetch, merged so nothing already on screen ever disappears.
  const loadMessages = useCallback(async () => {
    const { data } = await withTimeout(
      supabase.from('messages').select('*').eq('match_id', matchId).order('created_at')
    )
    if (data) {
      setMsgs((cur) => [...data, ...(cur || []).filter((m) => !data.some((d) => d.id === m.id))])
    }
  }, [matchId])

  const loadThread = useCallback(async () => {
    const { data: match, error } = await withTimeout(
      supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
    )
    // a failed request used to bounce silently back to the liks list, which
    // reads as the chat vanishing. Only a genuinely missing match navigates.
    if (error) {
      setLoadError(true)
      return
    }
    if (!match) {
      navigate('/matches', { replace: true })
      return
    }
    const otherId = match.user_a === user.id ? match.user_b : match.user_a
    const [personRes] = await Promise.all([
      withTimeout(supabase.from('profiles').select('*').eq('id', otherId).maybeSingle()),
      loadMessages(),
    ])
    if (personRes.error || !personRes.data) {
      setLoadError(true)
      return
    }
    // Same rule as the liks list: a chat is only reachable while both people
    // share a housing type. If a pool switch has made this a cross-pool match,
    // treat it like one that isn't there and fall back to the list - the match
    // and every message stay in the database, untouched, and the thread
    // reappears if the housing types line up again. Guard on both being known
    // so a not-yet-loaded profile never triggers a false redirect.
    if (
      profile?.housing_type &&
      personRes.data.housing_type &&
      personRes.data.housing_type !== profile.housing_type
    ) {
      navigate('/matches', { replace: true })
      return
    }
    setLoadError(false)
    setOther(personRes.data)
    setMsgs((cur) => cur || [])
  }, [matchId, user.id, profile?.housing_type, navigate, loadMessages])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  async function retryLoad() {
    setRetrying(true)
    await loadThread()
    setRetrying(false)
  }

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => appendUnique(payload.new)
      )
      // anything sent between the initial fetch and the channel going live
      // would otherwise be lost until the chat is reopened
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') loadMessages()
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, appendUnique, loadMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs])

  async function send(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setSendErr('')
    setDraft('')
    const { data, error } = await withTimeout(
      supabase
        .from('messages')
        .insert({ match_id: Number(matchId), sender: user.id, body })
        .select()
        .single()
    )
    if (error) {
      // hand the text back rather than swallowing it, and say why
      setDraft(body)
      setSendErr("That didn't send. Check your connection and try again")
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
        {loadError ? (
          <LoadError
            title="Can't open this chat right now"
            message="Your messages are safe. Check your connection and give it another go."
            onRetry={retryLoad}
            retrying={retrying}
            secondaryLabel="Back to Liks"
            onSecondary={() => navigate('/matches')}
          />
        ) : !msgs || !other ? (
          <div className="empty"><div className="spin" /></div>
        ) : msgs.length === 0 ? (
          <EmptyState
            mark="message"
            title="It's a lik. Now what?"
            message="Open strong. Ask about their thermostat stance. Mention the quiz answer you share. Anything beats hey."
          />
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

      {!loadError && (
        <div>
          {sendErr && (
            <p className="err" style={{ margin: 0, padding: '0 16px 6px', textAlign: 'center' }}>
              {sendErr}
            </p>
          )}
          <form className="chat-input-row" onSubmit={send}>
            <input
              className="input"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                if (sendErr) setSendErr('')
              }}
              placeholder={other ? `Message ${other.name}` : 'Message'}
              maxLength={2000}
              disabled={!other}
            />
            <button className="chat-send" type="submit" disabled={!draft.trim() || sending || !other}>
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
