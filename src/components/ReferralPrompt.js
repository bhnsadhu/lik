import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const DISMISS_KEY = 'lik-referral-prompt-dismissed';

// One-time sheet after onboarding: lik grows through friends, so we ask
// exactly once, right when the feed first opens, then never again.
export default function ReferralPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  const share = async () => {
    const link = `https://getlik.com?ref=${user.id}`;
    // native share sheet on phones, straight to clipboard on desktop
    const onMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    try {
      if (onMobile && navigator.share) {
        await navigator.share({
          title: 'lik',
          text: 'find your roommate on lik',
          url: link,
        });
        dismiss();
        return;
      }
    } catch {
      // user closed the share sheet: fall through to copy
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(dismiss, 1400);
    } catch {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="edit-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="edit-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="edit-sheet-handle" />
            <p className="referral-headline">know someone still looking?</p>
            <p className="referral-sub">
              lik works better when your people are on it · send them your link and
              you'll show up as a friend connection
            </p>
            <button className="btn-primary" onClick={share} style={{ marginTop: 14 }}>
              {copied ? 'link copied' : 'share your link'}
            </button>
            <button className="edit-sheet-cancel" onClick={dismiss}>
              maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
