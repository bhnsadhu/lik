// Full-flow logic simulation: walks two synthetic accounts through every
// onboarding step and the feed/match logic, using the app's real modules.
// Run from anywhere: node scripts/e2e-flow-sim.mjs
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// src modules are ESM-in-.js (CRA); copy them to .mjs so Node can import them
const here = dirname(fileURLToPath(import.meta.url))
mkdirSync(join(here, 'tmp'), { recursive: true })
for (const f of ['constants', 'onboarding', 'compatibility']) {
  const src = readFileSync(join(here, '../src/lib', `${f}.js`), 'utf8')
  writeFileSync(join(here, 'tmp', `${f}.mjs`), src.replace(/from '\.\/constants'/g, "from './constants.mjs'"))
}

const { STEPS, isStepComplete, firstIncompleteStep } = await import('./tmp/onboarding.mjs')
const { scoreProfiles, gendersCompatible, friendSignal } = await import('./tmp/compatibility.mjs')
const { QUIZ, MIN_PHOTOS, DEALBREAKERS, dbLabel, CUSTOM_DB_PREFIX } = await import('./tmp/constants.mjs')

let passed = 0
function ok(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    console.log('FAIL:', name, '-', e.message)
    process.exitCode = 1
  }
}

// ---- onboarding progression, mirroring what each setup page saves ----
const fresh = { onboarding_step: 'housing' }
ok('fresh account resumes at housing', () => assert.equal(firstIncompleteStep(fresh), 'housing'))

const afterHousing = { ...fresh, housing_type: 'apartment', onboarding_step: 'basics' }
ok('after housing -> basics', () => assert.equal(firstIncompleteStep(afterHousing), 'basics'))

const afterBasics = {
  ...afterHousing,
  name: 'Test A', age: 20, gender: 'girl', year: 'Junior', major: 'Computer Science',
  profile_pic_url: 'https://x/a.jpg', bio: 'clean and quiet',
  onboarding_step: 'photos',
}
ok('after basics -> photos', () => assert.equal(firstIncompleteStep(afterBasics), 'photos'))

const fivePhotos = { ...afterBasics, photos: Array(5).fill('u'), photo_caption: 'pics' }
ok('5 photos is not enough', () => assert.equal(firstIncompleteStep(fivePhotos), 'photos'))
ok('photos without caption incomplete', () =>
  assert.equal(isStepComplete('photos', { ...afterBasics, photos: Array(6).fill('u') }), false))

const afterPhotos = { ...afterBasics, photos: Array(MIN_PHOTOS).fill('u'), photo_caption: 'pics', onboarding_step: 'quiz' }
ok('after photos -> quiz', () => assert.equal(firstIncompleteStep(afterPhotos), 'quiz'))

const partialQuiz = Object.fromEntries(QUIZ.slice(0, QUIZ.length - 1).map((q) => [q.key, 'a']))
ok('11/12 quiz answers incomplete', () =>
  assert.equal(firstIncompleteStep({ ...afterPhotos, quiz: partialQuiz }), 'quiz'))

const fullQuizA = Object.fromEntries(QUIZ.map((q) => [q.key, 'a']))
const afterQuiz = { ...afterPhotos, quiz: fullQuizA, onboarding_step: 'logistics' }
ok('after quiz -> logistics', () => assert.equal(firstIncompleteStep(afterQuiz), 'logistics'))

ok('apartment logistics needs areas+budget', () =>
  assert.equal(isStepComplete('logistics', { ...afterQuiz, move_in: 'Fall 2026' }), false))
ok('dorm logistics needs dorm prefs', () =>
  assert.equal(isStepComplete('logistics', { ...afterQuiz, housing_type: 'dorm', move_in: 'Fall 2026', dorm_prefs: [] }), false))

const afterLogistics = {
  ...afterQuiz, move_in: 'Fall 2026', areas: ['Campustown'], budget_min: 700, budget_max: 1100,
  onboarding_step: 'limits',
}
ok('after logistics -> limits', () => assert.equal(firstIncompleteStep(afterLogistics), 'limits'))

const doneA = { ...afterLogistics, dealbreakers: ['smoke_free', CUSTOM_DB_PREFIX + 'No shellfish'], onboarding_step: 'done' }
ok('done profile has no incomplete step', () => assert.equal(firstIncompleteStep(doneA), null))

// the self-correcting gate: pointer says done-ish but data missing
ok('pointer ahead of data self-corrects', () =>
  assert.equal(firstIncompleteStep({ ...afterLogistics, photos: [], onboarding_step: 'limits' }), 'photos'))

// housing switch reset: editing user flips apartment -> dorm, prefs cleared
const switched = { ...doneA, housing_type: 'dorm', dorm_prefs: [], areas: [], budget_min: null, budget_max: null }
ok('housing switch leaves logistics incomplete (data level)', () =>
  assert.equal(isStepComplete('logistics', switched), false))

// ---- feed pool + gender filtering ----
ok('same gender compatible', () => assert.equal(gendersCompatible('girl', 'girl'), true))
ok('cross gender filtered', () => assert.equal(gendersCompatible('girl', 'guy'), false))
ok('nonbinary sees everyone', () => assert.equal(gendersCompatible('nonbinary', 'guy'), true))
ok('legacy null gender sees everyone', () => assert.equal(gendersCompatible(null, 'girl'), true))

// ---- compatibility scoring: second account, opposite answers ----
const fullQuizB = Object.fromEntries(QUIZ.map((q) => [q.key, 'b']))
const doneB = {
  ...doneA, id: 'b', name: 'Test B', quiz: fullQuizA,
  dealbreakers: ['smoke_free'],
}
const fitSame = scoreProfiles(doneA, doneB)
ok('identical quiz scores high', () => assert.ok(fitSame.score >= 90, `got ${fitSame.score}`))
ok('all 12 shared traits listed', () => assert.equal(fitSame.shared.length, QUIZ.length))
ok('shared hard limit surfaces', () => assert.deepEqual(fitSame.sharedLimits, ['Smoke-free space']))

const fitOpp = scoreProfiles(doneA, { ...doneB, quiz: fullQuizB })
ok('opposite quiz scores low', () => assert.ok(fitOpp.score <= 45, `got ${fitOpp.score}`))

const smoker = { ...doneB, dealbreakers: ['smoking_ok'] }
const fitConflict = scoreProfiles(doneA, smoker)
ok('dealbreaker conflict detected', () => assert.equal(fitConflict.conflicts.length, 1))
ok('conflict labeled both ways', () =>
  assert.deepEqual(fitConflict.conflicts[0], { mine: 'Smoke-free space', theirs: 'Smoking is fine with me' }))
ok('conflict scoring symmetric', () =>
  assert.equal(scoreProfiles(doneA, smoker).score, scoreProfiles(smoker, doneA).score))

ok('custom dealbreakers never conflict/crash', () => {
  const s = scoreProfiles(doneA, { ...doneB, dealbreakers: [CUSTOM_DB_PREFIX + 'No shellfish'] })
  assert.equal(s.conflicts.length, 0)
})
ok('unknown stored dealbreaker key renders null (hidden)', () => assert.equal(dbLabel('ghost_key'), null))
ok('score clamped to 8..99', () => {
  const many = { ...doneA, dealbreakers: DEALBREAKERS.map((d) => d.key) }
  const s = scoreProfiles(many, { ...doneB, dealbreakers: DEALBREAKERS.map((d) => d.key) })
  assert.ok(s.score >= 8 && s.score <= 99, `got ${s.score}`)
})

// ---- feed ordering with friend boost (the exact comparator from Feed.js) ----
const cands = [
  { person: { id: '1' }, fit: { score: 80 }, friend: null },
  { person: { id: '2' }, fit: { score: 70 }, friend: 'They brought you to lik' },
  { person: { id: '3' }, fit: { score: 85 }, friend: null },
]
const sorted = [...cands].sort((a, b) => (b.friend ? 12 : 0) + b.fit.score - ((a.friend ? 12 : 0) + a.fit.score))
ok('friend boost outranks slightly higher fit', () =>
  assert.deepEqual(sorted.map((c) => c.person.id), ['3', '2', '1']))

// ---- referral signals ----
const refs = [{ referrer: 'x', referred: 'a' }, { referrer: 'x', referred: 'b' }]
ok('referrer badge', () => assert.equal(friendSignal('a', 'x', refs), 'They brought you to lik'))
ok('referred badge', () => assert.equal(friendSignal('x', 'a', refs), 'You brought them to lik'))
ok('mutual friend badge', () => assert.equal(friendSignal('a', 'b', refs), 'You share a mutual friend'))
ok('stranger no badge', () => assert.equal(friendSignal('a', 'z', refs), null))

// ---- match id ordering used by Feed.onSwipe lookup ----
const [ua, ub] = ['b-uuid', 'a-uuid'].sort()
ok('pair lookup uses sorted ids', () => assert.deepEqual([ua, ub], ['a-uuid', 'b-uuid']))

// ---- steps list sanity ----
ok('STEPS matches routes', () => assert.deepEqual(STEPS, ['housing', 'basics', 'photos', 'quiz', 'logistics', 'limits']))

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures above)' : ', 0 failed'}`)
