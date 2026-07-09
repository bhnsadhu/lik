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

## Testing the full loop solo

The core loop (match, then chat) normally needs two people who like each
other. For review, the database is seeded with four **demo profiles**
(names end in "(Demo)", bios say they are demo profiles):

- Jordan (Demo), Sam (Demo) — dorm pool
- Riley (Demo), Casey (Demo) — apartment pool

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
student can ever see or match with them.

## Resetting the review account between sessions

The review account keeps its profile between sign-ins like any account.
To let a reviewer redo onboarding from scratch, delete the account
in-app (profile tab → Delete My Account) — the seeding for demo
profiles is unaffected — then recreate the reviewer auth user, or run
the reset SQL in the team's seeding notes.
