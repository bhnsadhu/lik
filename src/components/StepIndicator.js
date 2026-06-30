import React from 'react';

const steps = ['photos', 'profile', 'housing', 'vibe', 'details'];
const stepRoutes = ['/setup/photos', '/setup/basics', '/setup/housing', '/setup/bio', '/setup/quiz'];

export default function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', marginBottom: '14px' }}>
      {steps.map((step, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;
        return (
          <React.Fragment key={step}>
            <div onClick={() => onStepClick && onStepClick(stepRoutes[i])} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '8px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: done || active ? '#3DDCFF' : 'rgba(255,255,255,0.1)', boxShadow: active ? '0 0 0 3px rgba(61,220,255,0.18)' : 'none' }} />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '8px', fontWeight: 300, color: active ? 'rgba(255,255,255,0.5)' : done ? 'rgba(61,220,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: done ? 'rgba(61,220,255,0.3)' : 'rgba(255,255,255,0.06)', marginBottom: '17px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
