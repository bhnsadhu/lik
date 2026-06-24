# lik

find a place you lik. with someone you lik.

UIUC-only roommate-matching app — like Tinder, but for finding a roommate, not a date. University of Illinois Urbana-Champaign students only. Dark mode only. Minimal, intentional design.

---

## stack

| layer | tech |
|---|---|
| frontend | React (Create React App) |
| backend / db | Supabase (auth, database, storage) |
| email | Resend (magic link delivery) |
| deployment | Vercel (coming soon) |

---

## what's built

**auth**
- Magic link login — no passwords
- `@illinois.edu` email validation (bypassed locally, see notes)

**onboarding** (3-step flow)
1. Profile setup — name, age, year, 3–6 photos
2. Compatibility quiz — 12 this-or-that questions, auto-advance
3. Budget & preferences — monthly budget range, move-in semester, preferred areas (multi-select)

**main app**
- Discover feed — swipeable card stack, like/pass buttons
- Liks screen — matched users, tap to chat
- Chat — real-time 1:1 messaging per match
- Profile page — view your profile as others see it; edit profile, retake quiz, or edit preferences inline

**nav**
- Bottom nav: discover · liks · profile

---

## running locally

```bash
npm install
npm start
```

Requires `.env.local`:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## notes

- `.edu` validation is temporarily bypassed for local testing — `// TODO: re-enable .edu validation before launch`
- RLS policies need audit before public launch
- Resend free tier only delivers to the verified account email — custom domain pending before real user testing

---

## brand

- **name:** lik (always lowercase)
- **tagline:** find a place you lik. with someone you lik.
- **colors:** `#0A0E12` base · `#3DDCFF` accent
- **type:** Playfair Display (headings) · Inter (body)
- **voice:** lowercase, calm, minimal

---

## status

Active development. Core onboarding, profile, and discover/match/chat flow complete. Needs real user data to fully exercise the feed and matching logic.
