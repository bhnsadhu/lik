import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { STEPS } from '../../lib/onboarding'

// Saves fields for the current setup step, then advances the flow.
// When the user is editing from their profile (?edit=1), save returns them there.
export default function useSetupSave(step) {
  const { user, profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1' && profile?.onboarding_step === 'done'

  async function save(fields) {
    const idx = STEPS.indexOf(step)
    const nextStep = editing
      ? 'done'
      : idx === STEPS.length - 1
        ? 'done'
        : STEPS[idx + 1]

    const payload = { ...fields }
    if (!editing || profile.onboarding_step !== 'done') {
      // the step tabs let you go back and re-save an earlier step after
      // already progressing further - never let that regress the pointer
      const curIdx = profile.onboarding_step === 'done' ? STEPS.length : STEPS.indexOf(profile.onboarding_step)
      const nextIdx = nextStep === 'done' ? STEPS.length : STEPS.indexOf(nextStep)
      payload.onboarding_step = nextIdx > curIdx ? nextStep : profile.onboarding_step
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)

    if (editing) {
      navigate('/profile')
    } else if (nextStep === 'done') {
      localStorage.setItem('lik-show-referral', '1')
      navigate('/feed')
    } else {
      navigate(`/setup/${nextStep}`)
    }
  }

  return { save, editing, profile, user }
}
