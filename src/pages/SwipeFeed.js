import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

// Which quiz keys to show as pills on the card (4 most social)
const CARD_PILLS = [
  { key: 'sleep_schedule', a: '🌅 early bird', b: '🦉 night owl' },
  { key: 'noise', a: '🤫 quiet', b: '🎵 noise ok' },
  { key: 'social_battery', a: '🪴 homebody', b: '🎉 social' },
  { key: 'substances', a: '🌿 sober', b: '🍻 drinks ok' },
];

function SwipeCard({ profile, isTop, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-28, 28]);
  const likeOpacity = useTransform(x, [25, 90], [0, 1]);
  const passOpacity = useTransform(x, [-90, -25], [1, 0]);
  const controls = useAnimation();

  // Use a ref so stale closures in drag callbacks always get latest onSwipe
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => { onSwipeRef.current = onSwipe; }, [onSwipe]);

  const triggerSwipe = useCallback(
    async (dir) => {
      await controls.start({
        x: dir === 'like' ? 650 : -650,
        rotate: dir === 'like' ? 32 : -32,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      });
      onSwipeRef.current(dir, profile.id);
    },
    [controls, profile.id]
  );

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      triggerSwipe('like');
    } else if (info.offset.x < -100) {
      triggerSwipe('pass');
    } else {
      controls.start({ x: 0, rotate: 0, transition: { duration: 0.45, type: 'spring', stiffness: 300 } });
    }
  };

  const quiz = profile.quiz_responses?.[0];
  const photo = profile.photos?.[0];

  return (
    <motion.div
      className={`swipe-card ${isTop ? 'is-top' : ''}`}
      drag={isTop ? 'x' : false}
      dragElastic={0.85}
      style={{ x, rotate }}
      animate={controls}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={{ scale: 1.02 }}
    >
      {photo ? (
        <img src={photo} alt={profile.name} className="card-photo" draggable={false} />
      ) : (
        <div className="card-photo-placeholder">🎓</div>
      )}
      <div className="card-gradient" />

      {isTop && (
        <>
          <motion.div className="swipe-label like" style={{ opacity: likeOpacity }}>
            lik
          </motion.div>
          <motion.div className="swipe-label pass" style={{ opacity: passOpacity }}>
            pass
          </motion.div>
        </>
      )}

      <div className="card-info">
        <div className="card-name-row">
          <h2 className="card-name">{profile.name}, {profile.age}</h2>
          <span className="verified-badge">🎓 illinois.edu</span>
        </div>
        <p className="card-year">{profile.year}</p>

        {quiz && (
          <div className="card-pills">
            {CARD_PILLS.map(({ key, a, b }) => {
              const val = quiz[key];
              if (!val) return null;
              return <span key={key} className="pill">{val === 'a' ? a : b}</span>;
            })}
          </div>
        )}

        {profile.budget_min != null && (
          <p className="card-budget">
            ${profile.budget_min}–${profile.budget_max}/mo · {profile.preferred_area}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function MatchModal({ profile, onDismiss, onChat }) {
  return (
    <motion.div
      className="match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="match-modal"
        initial={{ scale: 0.82, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 22 }}
      >
        <p className="match-label">it's a lik!</p>
        <p className="match-sub">you and {profile.name} both liked each other 🎉</p>

        <div className="match-photo-ring">
          {profile.photos?.[0] ? (
            <img src={profile.photos[0]} alt={profile.name} className="match-photo" />
          ) : (
            <div className="match-photo-placeholder">🎓</div>
          )}
        </div>

        <div className="match-actions">
          <button className="btn-primary" onClick={onChat}>
            say hi 👋
          </button>
          <button className="btn-ghost" onClick={onDismiss}>
            keep swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SwipeFeed() {
  const { user } = useAuth();
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const deckRef = useRef(deck);

  useEffect(() => { deckRef.current = deck; }, [deck]);

  useEffect(() => {
    async function load() {
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = swipes?.map((s) => s.swiped_id) ?? [];

      let query = supabase
        .from('profiles')
        .select('*, quiz_responses(*)')
        .eq('onboarding_step', 'done')
        .neq('id', user.id)
        .limit(40);

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data } = await query;
      setDeck(data ?? []);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const handleSwipe = useCallback(
    async (dir, profileId) => {
      // Optimistic: remove from deck immediately
      const swiped = deckRef.current.find((p) => p.id === profileId);
      setDeck((d) => d.filter((p) => p.id !== profileId));

      const { error } = await supabase.from('swipes').insert({
        swiper_id: user.id,
        swiped_id: profileId,
        direction: dir,
      });

      if (error || dir !== 'like') return;

      // Check if the trigger created a match (it runs synchronously in Postgres)
      const u1 = user.id < profileId ? user.id : profileId;
      const u2 = user.id < profileId ? profileId : user.id;

      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle();

      if (match && swiped) {
        setMatchedProfile(swiped);
        setMatchId(match.id);
      }
    },
    [user.id]
  );

  const handleButtonSwipe = (dir) => {
    if (deck.length === 0) return;
    // For button taps, trigger via the top card's onSwipe directly
    handleSwipe(dir, deck[0].id);
  };

  const handleMatchDismiss = () => {
    setMatchedProfile(null);
    setMatchId(null);
  };

  const handleMatchChat = () => {
    setMatchedProfile(null);
    setMatchId(null);
    if (matchId) {
      window.location.href = `/chat/${matchId}`;
    }
  };

  return (
    <div className="app-page">
      <div className="app-header">
        <span className="wordmark">lik</span>
      </div>

      <div className="feed-body">
        {loading ? (
          <div className="empty-state">
            <p className="muted">still scanning your matches...</p>
          </div>
        ) : deck.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">🌙</p>
            <p className="empty-title">no liks yet</p>
            <p className="muted">your people are out there — check back soon</p>
          </div>
        ) : (
          <>
            <div className="card-stack">
              {deck.slice(0, 3).map((profile, i) => (
                <div
                  key={profile.id}
                  className="card-wrapper"
                  style={{
                    zIndex: 3 - i,
                    transform:
                      i === 0
                        ? 'none'
                        : `scale(${1 - i * 0.04}) translateY(${i * 11}px)`,
                  }}
                >
                  <SwipeCard
                    profile={profile}
                    isTop={i === 0}
                    onSwipe={handleSwipe}
                  />
                </div>
              ))}
            </div>

            <div className="swipe-buttons">
              <button
                className="swipe-btn pass"
                onClick={() => handleButtonSwipe('pass')}
              >
                ✕
              </button>
              <button
                className="swipe-btn like"
                onClick={() => handleButtonSwipe('like')}
              >
                ♡
              </button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {matchedProfile && (
          <MatchModal
            profile={matchedProfile}
            onDismiss={handleMatchDismiss}
            onChat={handleMatchChat}
          />
        )}
      </AnimatePresence>

      <BottomNav active="feed" />
    </div>
  );
}
