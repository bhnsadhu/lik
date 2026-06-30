import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    async function load() {
      const [matchRes, msgRes] = await Promise.all([
        supabase
          .from('matches')
          .select(`
            id,
            user1:user1_id(id, name, photos),
            user2:user2_id(id, name, photos)
          `)
          .eq('id', matchId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true }),
      ]);

      if (matchRes.data) {
        const m = matchRes.data;
        setOtherUser(m.user1?.id === user.id ? m.user2 : m.user1);
      }

      setMessages(msgRes.data ?? []);
      setLoading(false);
    }
    load();

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [matchId, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setDraft('');

    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });

    setSending(false);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/matches')}>
          ←
        </button>
        <div className="chat-header-user">
          {otherUser?.photos?.[0] && (
            <img
              src={otherUser.photos[0]}
              alt={otherUser.name}
              className="chat-header-avatar"
            />
          )}
          <span className="chat-header-name">{otherUser?.name ?? '...'}</span>
        </div>
      </div>

      <div className="messages-body">
        {loading ? (
          <p className="muted center-text">loading...</p>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-inner">
              <p style={{ color: 'var(--text)', fontWeight: 500 }}>it's a lik!</p>
              <p className="muted">say something to {otherUser?.name}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${msg.sender_id === user.id ? 'mine' : 'theirs'}`}
            >
              {msg.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          className="message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="say something..."
          disabled={sending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!draft.trim() || sending}
        >
          →
        </button>
      </form>
    </div>
  );
}
