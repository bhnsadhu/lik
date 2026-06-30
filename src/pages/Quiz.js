import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';

export const QUIZ_QUESTIONS = [
  {
    key: 'sleep_schedule',
    topic: 'sleep schedule',
    question: 'when do you come alive?',
    a: { label: 'early bird', emoji: '🌅' },
    b: { label: 'night owl', emoji: '🦉' },
  },
  {
    key: 'temperature',
    topic: 'temperature',
    question: "what's your ideal room?",
    a: { label: 'keep it cool', emoji: '🧊' },
    b: { label: 'keep it warm', emoji: '🔥' },
  },
  {
    key: 'cleanliness',
    topic: 'cleanliness',
    question: 'how do you keep your space?',
    a: { label: 'tidy as you go', emoji: '✨' },
    b: { label: 'deep clean weekly', emoji: '🧹' },
  },
  {
    key: 'noise',
    topic: 'noise level',
    question: "what's the vibe at home?",
    a: { label: 'peace & quiet', emoji: '🤫' },
    b: { label: 'background noise ok', emoji: '🎵' },
  },
  {
    key: 'shared_spaces',
    topic: 'shared spaces',
    question: 'how do you use common areas?',
    a: { label: 'everyone equally', emoji: '🛋️' },
    b: { label: 'my space is sacred', emoji: '🚪' },
  },
  {
    key: 'study_habits',
    topic: 'study habits',
    question: 'where do you hit the books?',
    a: { label: 'study at home', emoji: '🏠' },
    b: { label: 'out of the house', emoji: '☕' },
  },
  {
    key: 'social_battery',
    topic: 'social battery',
    question: 'weeknight default?',
    a: { label: 'in & cozy', emoji: '🪴' },
    b: { label: 'out most nights', emoji: '🎉' },
  },
  {
    key: 'guests',
    topic: 'guests',
    question: 'people coming over?',
    a: { label: 'rarely', emoji: '🚫' },
    b: { label: 'always welcome', emoji: '🤗' },
  },
  {
    key: 'groceries',
    topic: 'groceries',
    question: 'food situation?',
    a: { label: 'shop separately', emoji: '🛒' },
    b: { label: 'split & share', emoji: '🤝' },
  },
  {
    key: 'substances',
    topic: 'lifestyle',
    question: "what's your space like?",
    a: { label: 'totally sober', emoji: '🌿' },
    b: { label: 'casual drinks ok', emoji: '🍻' },
  },
  {
    key: 'conflict_style',
    topic: 'conflict style',
    question: 'when something bugs you...',
    a: { label: 'talk it out now', emoji: '💬' },
    b: { label: 'cool down first', emoji: '❄️' },
  },
  {
    key: 'budget_flexibility',
    topic: 'budget',
    question: 'on rent budget...',
    a: { label: 'firm on the number', emoji: '💰' },
    b: { label: 'flexible if worth it', emoji: '💎' },
  },
];

export default function Quiz() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) return;
    async function loadExisting() {
      const { data } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const initial = {};
        QUIZ_QUESTIONS.forEach((q) => {
          if (data[q.key]) initial[q.key] = data[q.key];
        });
        setAnswers(initial);
      }
      setLoadingExisting(false);
    }
    loadExisting();
  }, [isEditMode, user.id]);

  const q = QUIZ_QUESTIONS[current];
  const progress = (current / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = async (answer) => {
    const newAnswers = { ...answers, [q.key]: answer };
    setAnswers(newAnswers);

    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent((i) => i + 1);
      return;
    }

    setSaving(true);

    const quizData = {};
    QUIZ_QUESTIONS.forEach((qq) => {
      quizData[qq.key] = newAnswers[qq.key];
    });

    await supabase.from('quiz_responses').upsert(
      { user_id: user.id, ...quizData },
      { onConflict: 'user_id' }
    );

    if (isEditMode) {
      await refreshProfile();
      navigate('/profile');
      return;
    }

    await supabase
      .from('profiles')
      .update({ onboarding_step: 'preferences', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    navigate('/setup/preferences');
  };

  const backHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
    </div>
  );

  if (loadingExisting) {
    return (
      <div className="quiz-page">
        <div className="quiz-inner">
          {backHeader}
          <div className="quiz-saving">
            <p className="muted">loading your answers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="quiz-page">
        <div className="quiz-inner">
          {backHeader}
          {!isEditMode && <StepIndicator currentStep={4} onStepClick={(route) => navigate(route)} />}
          <div className="quiz-saving">
            <p className="muted">{isEditMode ? 'saving changes...' : 'building your vibe...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-inner">
        {backHeader}
        {!isEditMode && <StepIndicator currentStep={4} onStepClick={(route) => navigate(route)} />}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
            className="quiz-content"
          >
            <p className="quiz-topic">{q.topic}</p>
            <h2 className="quiz-question">{q.question}</h2>
            <p className="quiz-count">{current + 1} of {QUIZ_QUESTIONS.length}</p>

            <div className="quiz-options">
              <button
                className={`quiz-option${answers[q.key] === 'a' ? ' selected' : ''}`}
                onClick={() => handleAnswer('a')}
              >
                <span className="option-label">{q.a.label}</span>
              </button>
              <button
                className={`quiz-option${answers[q.key] === 'b' ? ' selected' : ''}`}
                onClick={() => handleAnswer('b')}
              >
                <span className="option-label">{q.b.label}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
