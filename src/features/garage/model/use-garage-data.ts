import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchBikes, subscribeToBikes } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';
import { fetchUserProfile, setActiveBike, subscribeToUserProfile } from '@/lib/firestore/user-profile';

import { resolveActiveBike } from './active-bike';
import { toGarageErrorMessage } from './errors';

type State = {
  /** null until the first snapshot arrives. */
  bikes: WithId<Bike>[] | null;
  /** undefined until the profile snapshot arrives. */
  activeBikeId: string | null | undefined;
  error: string | null;
};

/** Live bikes plus the active bike. Shared by the garage and home screens. */
export function useGarageData() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<State>({ bikes: null, activeBikeId: undefined, error: null });
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const onError = (e: unknown) => setState((s) => ({ ...s, error: toGarageErrorMessage(e) }));
    const unsubscribeBikes = subscribeToBikes(
      uid,
      (bikes) => setState((s) => ({ ...s, bikes, error: null })),
      onError
    );
    const unsubscribeProfile = subscribeToUserProfile(
      uid,
      (profile) => setState((s) => ({ ...s, activeBikeId: profile?.activeBikeId ?? null })),
      // The garage still works without the profile; fall back to the first bike.
      () => setState((s) => ({ ...s, activeBikeId: null }))
    );
    return () => {
      unsubscribeBikes();
      unsubscribeProfile();
    };
  }, [uid]);

  const bikes = state.bikes ?? [];
  // Show the pending choice right away instead of waiting for the server.
  const activeBike = resolveActiveBike(bikes, switchingTo ?? state.activeBikeId);

  async function makeActive(bikeId: string) {
    if (!user || switchingTo || bikeId === activeBike?.id) return;
    setSwitchingTo(bikeId);
    try {
      await setActiveBike(user, bikeId);
      setState((s) => ({ ...s, error: null }));
    } catch (e) {
      setState((s) => ({ ...s, error: toGarageErrorMessage(e) }));
    } finally {
      setSwitchingTo(null);
    }
  }

  async function refresh() {
    if (!uid) return;
    const [freshBikes, profile] = await Promise.all([fetchBikes(uid), fetchUserProfile(uid)]);
    setState({ bikes: freshBikes, activeBikeId: profile?.activeBikeId ?? null, error: null });
  }

  return {
    bikes,
    activeBike,
    loading: (state.bikes === null || state.activeBikeId === undefined) && state.error === null,
    error: state.error,
    makeActive,
    refresh,
  };
}
