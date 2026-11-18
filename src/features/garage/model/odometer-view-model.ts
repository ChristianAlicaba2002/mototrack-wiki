import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { recordOdometerReading, subscribeToBike, subscribeToOdometerReadings } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike, OdometerReading } from '@/lib/firestore/types';

import { bikeDisplayName } from './active-bike';
import { toGarageErrorMessage } from './errors';
import { validateOdometerReading } from './odometer';

export const HISTORY_LIMIT = 50;

export type OdometerLoadState = 'loading' | 'ready' | 'notFound' | 'error';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/garage');
}

/** Update one bike's odometer and show its reading history. */
export function useOdometerViewModel(bikeId: string) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [bike, setBike] = useState<WithId<Bike> | null | undefined>(undefined);
  const [readings, setReadings] = useState<WithId<OdometerReading>[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bikeId) return;
    const onError = (e: unknown) => setLoadError(toGarageErrorMessage(e));
    const unsubscribeBike = subscribeToBike(uid, bikeId, setBike, onError);
    const unsubscribeReadings = subscribeToOdometerReadings(uid, bikeId, HISTORY_LIMIT, setReadings, onError);
    return () => {
      unsubscribeBike();
      unsubscribeReadings();
    };
  }, [uid, bikeId]);

  const currentKm = bike?.odometerKm ?? 0;
  const validation = useMemo(() => validateOdometerReading(text, currentKm), [text, currentKm]);

  const loadState: OdometerLoadState =
    !bikeId || bike === null ? 'notFound' : loadError && bike === undefined ? 'error' : bike === undefined ? 'loading' : 'ready';

  async function save() {
    setSubmitted(true);
    if (!uid || validation.value === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      await recordOdometerReading(uid, bikeId, validation.value);
      close();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return {
    loadState,
    bike: bike ?? null,
    title: bike ? bikeDisplayName(bike) : 'Odometer',
    currentKm,
    readings: readings ?? [],
    readingsLoading: readings === null && loadError === null,
    text,
    fieldError: submitted || touched ? validation.error : undefined,
    saving,
    error: error ?? loadError,
    setText,
    blur: () => setTouched(true),
    save,
    cancel: close,
  };
}

export type OdometerViewModel = ReturnType<typeof useOdometerViewModel>;
