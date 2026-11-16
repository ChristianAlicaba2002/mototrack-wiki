import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { subscribeToBikes } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { toGarageErrorMessage } from './errors';

type GarageState = {
  /** null until the first snapshot arrives. */
  bikes: WithId<Bike>[] | null;
  error: string | null;
};

export function useGarageViewModel() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<GarageState>({ bikes: null, error: null });

  useEffect(() => {
    if (!uid) return;
    return subscribeToBikes(
      uid,
      (bikes) => setState({ bikes, error: null }),
      (e) => setState((s) => ({ ...s, error: toGarageErrorMessage(e) }))
    );
  }, [uid]);

  function addBike() {
    router.push('/bike-form');
  }

  function editBike(id: string) {
    router.push({ pathname: '/bike-form', params: { id } });
  }

  return {
    bikes: state.bikes ?? [],
    loading: state.bikes === null && state.error === null,
    error: state.error,
    addBike,
    editBike,
  };
}

export type GarageViewModel = ReturnType<typeof useGarageViewModel>;
