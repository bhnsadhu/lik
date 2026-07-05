import { QUIZ } from './constants'

export const STEPS = ['housing', 'basics', 'photos', 'quiz', 'logistics', 'limits']

// A step is complete when its required data actually exists on the profile -
// not just when the stored onboarding_step pointer has moved past it. This
// keeps the tab bar (and routing) correct even if a profile's pointer is
// ever inconsistent with its real fields.
export function isStepComplete(step, profile) {
  if (!profile) return false
  switch (step) {
    case 'housing':
      return !!profile.housing_type
    case 'basics':
      return !!(profile.name && profile.age && profile.gender && profile.year && profile.major && profile.profile_pic_url && profile.bio)
    case 'photos':
      return (profile.photos?.length || 0) > 0
    case 'quiz':
      return Object.keys(profile.quiz || {}).length >= QUIZ.length
    case 'logistics':
      if (!profile.move_in) return false
      return profile.housing_type === 'dorm'
        ? (profile.dorm_prefs?.length || 0) > 0
        : (profile.areas?.length || 0) > 0 && profile.budget_max != null
    case 'limits':
      // dealbreakers can legitimately be an empty array ("no hard limits"),
      // so field presence alone can't tell "never visited" from "chose none" -
      // limits is the last step, so completion is just overall done-ness.
      return profile.onboarding_step === 'done'
    default:
      return false
  }
}

// The true "resume here" step, derived from real data rather than the raw
// pointer. Returns null once every step's data is actually present.
export function firstIncompleteStep(profile) {
  return STEPS.find((s) => !isStepComplete(s, profile)) ?? null
}
