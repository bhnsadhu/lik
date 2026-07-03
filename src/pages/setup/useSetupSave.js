import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { STEPS } from '../../components/StepDots'

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
    if (!editing || profile.onboarding_step !== 'done') payload.onboarding_step = nextStep

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
