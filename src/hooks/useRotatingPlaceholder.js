import { useState, useEffect } from 'react';

export default function useRotatingPlaceholder(examples, intervalMs = 3500) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % examples.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [examples.length, intervalMs]);
  return examples[index];
}
