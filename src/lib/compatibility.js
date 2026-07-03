import { QUIZ, DB_BY_KEY } from './constants'

// Compatibility between two profiles.
// Quiz agreement sets the base, dealbreaker conflicts dominate everything else.
export function scoreProfiles(me, them) {
  const myQuiz = me.quiz || {}
  const theirQuiz = them.quiz || {}
  const myDb = me.dealbreakers || []
  const theirDb = them.dealbreakers || []

  const shared = []
  let answered = 0
  let agree = 0
  for (const q of QUIZ) {
    const mine = myQuiz[q.key]
    const theirs = theirQuiz[q.key]
    if (!mine || !theirs) continue
    answered += 1
    if (mine === theirs) {
      agree += 1
      shared.push(mine === 'a' ? q.shareA : q.shareB)
    }
  }

  const quizRatio = answered >= 4 ? agree / answered : 0.55
  let score = 38 + quizRatio * 54

  // conflicts: my hard limit vs their hard limit, counted once per pair
  const conflicts = []
  const seen = new Set()
  for (const mine of myDb) {
    const def = DB_BY_KEY[mine]
    if (!def) continue
    for (const c of def.conflicts) {
      if (!theirDb.includes(c)) continue
      const pairKey = [mine, c].sort().join('|')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)
      conflicts.push({ mine, theirs: c })
    }
  }
  for (const theirs of theirDb) {
    const def = DB_BY_KEY[theirs]
    if (!def) continue
    for (const c of def.conflicts) {
      if (!myDb.includes(c)) continue
      const pairKey = [theirs, c].sort().join('|')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)
      conflicts.push({ mine: c, theirs })
    }
  }

  score -= conflicts.length * 17
  if (conflicts.length === 0 && myDb.length > 0 && theirDb.length > 0) score += 5

  const sharedLimits = myDb.filter((k) => theirDb.includes(k) && DB_BY_KEY[k])
  score += Math.min(sharedLimits.length * 2, 6)

  return {
    score: Math.max(8, Math.min(99, Math.round(score))),
    shared,
    sharedLimits: sharedLimits.map((k) => DB_BY_KEY[k].label),
    conflicts: conflicts.map((c) => ({
      mine: DB_BY_KEY[c.mine].label,
      theirs: DB_BY_KEY[c.theirs].label,
    })),
  }
}

// Referral relationship between me and a candidate, given all referral rows.
export function friendSignal(meId, themId, referrals) {
  for (const r of referrals) {
    if (r.referrer === themId && r.referred === meId) return 'they brought you to lik'
    if (r.referrer === meId && r.referred === themId) return 'you brought them to lik'
  }
  const myReferrer = referrals.find((r) => r.referred === meId)?.referrer
  const theirReferrer = referrals.find((r) => r.referred === themId)?.referrer
  if (myReferrer && myReferrer === theirReferrer) return 'you share a mutual friend'
  return null
}
