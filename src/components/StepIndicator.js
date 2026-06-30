import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const steps = ['photos', 'profile', 'housing', 'quiz', 'preferences'];
const stepRoutes = ['/setup/photos', '/setup/basics', '/setup/housing', '/setup/quiz', '/setup/preferences'];

export default function StepIndicator({ currentStep, onStepClick }) {
  const { profile } = useAuth();
  const housingSet = !!profile?.housing_type;

  const handleClick = (step, route) => {
    if (!onStepClick) return;
    if (step === 'preferences' && !housingSet) {
      onStepClick('/setup/housing');
      return;
    }
    onStepClick(route);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '3px',
      margin: '0 18px 16px'
    }}>
      {steps.map((step, i) => {
        const num = i + 1;
        const active = num === currentStep;
        const done = num < currentStep;
        return (
          <div
            key={step}
            onClick={() => handleClick(step, stepRoutes[i])}
            style={{
              flex: 1,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              background: active ? 'rgba(61,220,255,0.2)' : done ? 'rgba(61,220,255,0.12)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '9px',
              fontWeight: active ? 600 : done ? 500 : 300,
              color: active || done ? '#3DDCFF' : 'rgba(255,255,255,0.2)',
              lineHeight: '1'
            }}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
