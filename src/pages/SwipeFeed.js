import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionValueEvent, animate } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

// ─── Match Moment ────────────────────────────────────────────

function MatchMoment({ theirProfile, matchId, myProfile, onDismiss, onMessage }) {
  return (
    <motion.div
      className="match-takeover"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="match-photos-row">
        <motion.div
          className="match-photo-wrap"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
          {myProfile?.photos?.[0]
            ? <img className="match-photo-img" src={myProfile.photos[0]} alt="" />
            : <div className="match-photo-placeholder" />}
        </motion.div>
        <motion.div
          className="match-photo-wrap"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
        >
          {theirProfile?.photos?.[0]
            ? <img className="match-photo-img" src={theirProfile.photos[0]} alt="" />
            : <div className="match-photo-placeholder" />}
        </motion.div>
      </div>

      <motion.div
        className="match-text-block"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35 }}
      >
        <p className="match-headline">it's a lik.</p>
        <p className="match-subline">
          you and <span className="match-their-name">{theirProfile?.name}</span>
        </p>
      </motion.div>

      <motion.div
        className="match-cta-group"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        <button className="btn-primary" onClick={onMessage}>send a message</button>
        <button className="btn-ghost" onClick={onDismiss}>keep swiping</button>
      </motion.div>
    </motion.div>
  );
}

// ─── Detail View ─────────────────────────────────────────────

function DetailView({ person, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = person.photos || [];
  const areas = Array.isArray(person.preferred_area) ? person.preferred_area : [];
  const dorms = Array.isArray(person.dorm_preference) ? person.dorm_preference : [];

  return (
    <motion.div
      className="detail-overlay"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <div className="detail-inner">
        <div className="detail-hero">
          {photos.length > 0 && (
            <img className="detail-hero-img" src={photos[photoIdx]} alt="" />
          )}
          {photoIdx > 0 && (
            <button
              className="detail-tap-prev"
              onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
            />
          )}
          {photoIdx < photos.length - 1 && (
            <button
              className="detail-tap-next"
              onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
            />
          )}
          {photos.length > 1 && (
            <div className="detail-photo-bars">
              {photos.map((_, i) => (
                <div key={i} className={`detail-photo-bar${i === photoIdx ? ' active' : ''}`} />
              ))}
            </div>
          )}
          <div className="detail-hero-gradient" />
          <div className="detail-hero-info">
            <p className="detail-hero-name">{person.name}, {person.age}</p>
            <p className="detail-hero-meta">
              {person.year}{person.major ? ` · ${person.major}` : ''}
            </p>
          </div>
          <button className="detail-close-btn" onClick={onClose}>↓</button>
        </div>

        <div className="detail-body">
          {person.bio && (
            <div className="detail-section">
              <p className="detail-bio">"{person.bio}"</p>
            </div>
          )}
          {person.housing_type && (
            <div className="detail-section">
              <p className="label">looking for</p>
              <span className={`housing-badge ${person.housing_type}`}>
                {person.housing_type === 'dorm' ? 'dorm' : 'apartment'}
              </span>
            </div>
          )}
          {person.move_in_semester && (
            <div className="detail-section">
              <p className="label">move-in</p>
              <p className="detail-value">{person.move_in_semester}</p>
            </div>
          )}
          {person.housing_type === 'apartment' && person.budget_min != null && (
            <div className="detail-section">
              <p className="label">budget</p>
              <p className="detail-value">${person.budget_min} to ${person.budget_max}/mo</p>
            </div>
          )}
          {person.housing_type === 'apartment' && areas.length > 0 && (
            <div className="detail-section">
              <p className="label">areas</p>
              <div className="detail-chips">
                {areas.map(a => <span key={a} className="profile-chip">{a}</span>)}
              </div>
            </div>
          )}
          {person.housing_type === 'dorm' && dorms.length > 0 && (
            <div className="detail-section">
              <p className="label">dorm preference</p>
              <div className="detail-chips">
                {dorms.map(d => <span key={d} className="profile-chip">{d}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Swipe Card Content ───────────────────────────────────────

function SwipeCardContent({ person, overlay, isTop, depth, onOpenDetail }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = person.photos || [];

  const handlePhotoTap = (e) => {
    if (!isTop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.33) {
      setPhotoIdx(i => Math.max(0, i - 1));
    } else {
      setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
    }
  };

  return (
    <div className={`swipe-card-inner depth-${depth}-inner`}>
      {photos.length > 0 ? (
        <img
          className="swipe-card-photo"
          src={photos[photoIdx]}
          alt=""
          onClick={handlePhotoTap}
          draggable={false}
        />
      ) : (
        <div className="swipe-card-placeholder" />
      )}

      {isTop && photos.length > 1 && (
        <div className="swipe-photo-bars">
          {photos.map((_, i) => (
            <div key={i} className={`swipe-photo-bar${i === photoIdx ? ' active' : ''}`} />
          ))}
        </div>
      )}

      {person.housing_type && (
        <div className={`card-housing-badge ${person.housing_type}`}>
          {person.housing_type === 'dorm' ? 'dorm' : 'apt'}
        </div>
      )}

      {isTop && overlay === 'right' && (
        <div className="swipe-overlay-label like">lik</div>
      )}
      {isTop && overlay === 'left' && (
        <div className="swipe-overlay-label pass">pass</div>
      )}

      <div className="swipe-card-gradient" />

      <div className="swipe-card-info">
        <span className="swipe-name">{person.name}, {person.age}</span>
        <p className="swipe-meta">
          {person.year}{person.major ? ` · ${person.major}` : ''}
        </p>
        {person.bio && <p className="swipe-bio">{person.bio}</p>}
        {isTop && (
          <button className="card-info-toggle" onClick={onOpenDetail}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="9" cy="9" r="8" />
              <line x1="9" y1="8" x2="9" y2="13" />
              <circle cx="9" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Feed ───────────────────────────────────────────────

export default function SwipeFeed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState(null);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [housingFilter, setHousingFilter] = useState(null);

  const topCardX = useMotionValue(0);
  const topCardRotate = useTransform(topCardX, [-200, 200], [-15, 15]);

  useMotionValueEvent(topCardX, 'change', (x) => {
    if (x > 30) setOverlay('right');
    else if (x < -30) setOverlay('left');
    else setOverlay(null);
  });

  const loadDeck = useCallback(async (filter) => {
    setLoading(true);
    const { data: swiped } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id);

    const swipedIds = (swiped || []).map(s => s.swiped_id);
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('onboarding_step', 'done');

    if (filter) query = query.eq('housing_type', filter);
    if (swipedIds.length > 0) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data } = await query.limit(40);
    setDeck(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadDeck(housingFilter);
  }, [housingFilter, loadDeck]);

  const handleSwipe = useCallback(async (dir, person) => {
    await supabase.from('swipes').insert({
      swiper_id: user.id,
      swiped_id: person.id,
      direction: dir === 'right' ? 'like' : 'pass',
    });

    if (dir !== 'right') return;

    const u1 = user.id < person.id ? user.id : person.id;
    const u2 = user.id < person.id ? person.id : user.id;
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .maybeSingle();

    if (match) {
      setMatchedProfile(person);
      setMatchId(match.id);
    }
  }, [user.id]);

  const handleCardLeft = useCallback((personId) => {
    setDeck(prev => prev.filter(p => p.id !== personId));
    setOverlay(null);
  }, []);

  const flyCard = useCallback(async (dir, person) => {
    const target = dir === 'right' ? 800 : -800;
    const controls = animate(topCardX, target, { duration: 0.28, ease: [0.4, 0, 0.6, 1] });
    await new Promise(r => setTimeout(r, 220));
    controls.stop();
    topCardX.set(0);
    handleSwipe(dir, person);
    handleCardLeft(person.id);
  }, [topCardX, handleSwipe, handleCardLeft]);

  const handleDragEnd = useCallback((e, info, person) => {
    const THRESHOLD = 80;
    if (info.offset.x > THRESHOLD || info.velocity.x > 600) {
      flyCard('right', person);
    } else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) {
      flyCard('left', person);
    } else {
      animate(topCardX, 0, { type: 'spring', stiffness: 400, damping: 30 });
      setOverlay(null);
    }
  }, [flyCard, topCardX]);

  const swipeCard = useCallback((dir) => {
    if (deck.length === 0) return;
    flyCard(dir, deck[0]);
  }, [deck, flyCard]);

  // Render reversed: deck[0] is last DOM child = highest stacking order
  const visibleDeck = deck.slice(0, 3).reverse();

  return (
    <div className="feed-page">
      <div className="feed-filter-bar">
        {[
          { key: null, label: 'all' },
          { key: 'dorm', label: 'dorm' },
          { key: 'apartment', label: 'apt' },
        ].map(({ key, label }) => (
          <button
            key={String(key)}
            className={`feed-filter-btn${housingFilter === key ? ' active' : ''}`}
            onClick={() => setHousingFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="feed-area">
        {loading ? (
          <div className="feed-loading">
            <p className="muted">finding people...</p>
          </div>
        ) : deck.length === 0 ? (
          <div className="feed-empty">
            <p className="empty-title">you've seen everyone</p>
            <p className="muted">check back later</p>
          </div>
        ) : (
          <>
            {visibleDeck.map((person, i) => {
              const depth = visibleDeck.length - 1 - i;
              const isTop = depth === 0;
              const scale = depth === 0 ? 1 : depth === 1 ? 0.95 : 0.90;
              const yOffset = depth === 0 ? 0 : depth === 1 ? 8 : 16;

              return (
                <motion.div
                  key={person.id}
                  className={`tinder-card-wrapper card-depth-${depth}`}
                  style={isTop
                    ? { x: topCardX, rotate: topCardRotate, scale, y: yOffset }
                    : { scale, y: yOffset }
                  }
                  drag={isTop ? 'x' : false}
                  dragElastic={0.7}
                  dragMomentum={false}
                  onDragEnd={isTop ? (e, info) => handleDragEnd(e, info, person) : undefined}
                >
                  <SwipeCardContent
                    person={person}
                    overlay={isTop ? overlay : null}
                    isTop={isTop}
                    depth={depth}
                    onOpenDetail={isTop ? () => setShowDetail(true) : undefined}
                  />
                </motion.div>
              );
            })}

            <div className="feed-actions">
              <button className="feed-action-btn pass" onClick={() => swipeCard('left')}>✕</button>
              <button className="feed-action-btn like" onClick={() => swipeCard('right')}>♡</button>
            </div>
          </>
        )}
      </div>

      <BottomNav active="feed" />

      <AnimatePresence>
        {matchedProfile && (
          <MatchMoment
            key={matchId}
            theirProfile={matchedProfile}
            matchId={matchId}
            myProfile={profile}
            onDismiss={() => { setMatchedProfile(null); setMatchId(null); }}
            onMessage={() => navigate(`/chat/${matchId}`)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && deck.length > 0 && (
          <DetailView
            key={deck[0].id}
            person={deck[0]}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
