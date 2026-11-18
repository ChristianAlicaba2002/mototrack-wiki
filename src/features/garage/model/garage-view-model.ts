import { router } from 'expo-router';

import { useGarageData } from './use-garage-data';

export function openOdometer(bikeId: string) {
  router.push({ pathname: '/odometer', params: { id: bikeId } });
}

export function useGarageViewModel() {
  const { bikes, activeBike, loading, error, makeActive } = useGarageData();

  function addBike() {
    router.push('/bike-form');
  }

  function editBike(id: string) {
    router.push({ pathname: '/bike-form', params: { id } });
  }

  return {
    bikes,
    activeBikeId: activeBike?.id ?? null,
    loading,
    error,
    addBike,
    editBike,
    makeActive,
    updateOdometer: openOdometer,
  };
}

export type GarageViewModel = ReturnType<typeof useGarageViewModel>;
