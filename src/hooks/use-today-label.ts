import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function useTodayLabel(): string {
  const [label, setLabel] = useState(formatToday);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setLabel(formatToday());
      }
    });
    return () => subscription.remove();
  }, []);

  return label;
}
