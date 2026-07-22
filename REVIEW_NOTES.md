# App Store review notes for lik

lik is a roommate-matching app exclusively for University of Illinois
Urbana-Champaign students. Normal sign-in requires an illinois.edu email
address and a one-time code sent to it, which an App Review tester cannot
receive. The app therefore ships a dedicated review path.

## Review account

- On the login screen, enter the email `applereview@getlik.com`.
- The app detects this address and asks for a **password** instead of
  emailing a code. The password is provided in the App Review notes in
  App Store Connect (never committed to this repository).
- This is the only account that signs in with a password; every real user
  goes through the illinois.edu one-time-code flow.
- The account is reset and starts at the first onboarding step, so the
  reviewer sees the flow from the beginning.

## Testing the full loop solo

The core loop (match, then chat) normally needs two people who like each
other. For review, the database is seeded with four demo profiles —
Jordan and Sam in the dorm pool, Riley and Casey in the apartment pool.

Mechanics, so the reviewer can complete everything alone:

1. Sign in as the review account and complete onboarding normally
   (housing, basics, six photos, quiz, preferences, hard limits).
   Any photos from the simulator library work.
2. The feed shows the demo profiles for the chosen housing pool.
3. Swipe right ("lik") on any demo profile. A database trigger makes the
   demo account instantly like back, the existing mutual-like trigger
   creates the match, and the "It's a lik" match screen appears.
4. Tap through to chat and send messages. (Demo accounts do not reply —
   they are seeded rows, not bots.)
5. Account deletion is available under the profile tab ("Delete My
   Account"), and the privacy policy at the `/privacy` route is linked
   from both the login screen and the profile tab.

Demo profiles are invisible to real users: the feed filters out
`is_demo` rows for everyone except the review account, so no real
student can ever see or match with them. Their photos are deliberate
abstract artwork in the app's palette rather than pictures of people,
since inventing photographs of students who do not exist would be worse
than showing art that is obviously art. Everything else about them
(bios, quiz answers, hard limits, housing preferences, six photos each)
is filled in exactly as a real profile would be.

## Resetting the review account between sessions

The review account keeps its profile between sign-ins like any account.
To let a reviewer redo onboarding from scratch, delete the account
in-app (profile tab → Delete My Account) — the seeding for demo
profiles is unaffected — then recreate the reviewer auth user, or run
the reset SQL in the team's seeding notes.

## Before every submission

- [ ] **Supabase project must not be paused.** The project is on the
      free plan, which pauses after a stretch of inactivity. A review can
      sit in the queue for days, and a paused backend fails every request
      in the app at once — the app would look completely broken through
      no fault of the build. `/api/keepalive` runs daily on a Vercel cron
      as a safety net, but upgrading the project to Pro is the only real
      guarantee. Check the project status in the Supabase dashboard on
      the day of submission.
- [ ] Reviewer password from `applereview@getlik.com` is pasted into the
      App Store Connect review notes.
- [ ] App name in App Store Connect matches `CFBundleDisplayName` in
      `ios/App/App/Info.plist` (currently "lik").
- [ ] The Supabase **Confirm signup** and **Magic Link** email templates
      send the `{{ .Token }}` code, not a confirmation link — otherwise
      real new users get a link the app cannot consume.
