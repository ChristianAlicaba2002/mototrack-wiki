import { useEffect, useMemo, useRef, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { parseWholeNumber } from '@/features/garage/model/bike-form';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { formatKm } from '@/features/garage/model/odometer';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToBike } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import { createService, deleteService, getService, updateService } from '@/lib/firestore/services';
import type { Bike, ServiceType } from '@/lib/firestore/types';

import { closeServiceScreen } from './navigation';
import {
  earliestServiceDate,
  emptyServiceForm,
  latestServiceDate,
  type ServiceFormErrors,
  type ServiceFormField,
  type ServiceFormValues,
  startOfDay,
  toFormValues,
  validateServiceForm,
} from './service-form';

export type ServiceFormLoadState = 'loading' | 'ready' | 'notFound' | 'error';
export type ServiceFormPending = 'save' | 'delete' | null;

/** Log a new service for a bike (no serviceId), or edit / delete one. */
export function useServiceFormViewModel(bikeId: string, serviceId: string | undefined) {
  const { user } = useAuth();
  const uid = user?.uid;
  const isEdit = serviceId !== undefined;

  const [bike, setBike] = useState<WithId<Bike> | null | undefined>(undefined);
  const [values, setValues] = useState<ServiceFormValues>(() => emptyServiceForm());
  /** Edit only: false until the service is loaded. */
  const [serviceLoaded, setServiceLoaded] = useState(false);
  /** New only: the odometer is prefilled once, from the first bike snapshot. */
  const prefilled = useRef(false);
  const [serviceMissing, setServiceMissing] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<ServiceFormField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState<ServiceFormPending>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The bike, live: its odometer decides whether saving also moves it up.
  useEffect(() => {
    if (!uid || !bikeId) return;
    return subscribeToBike(
      uid,
      bikeId,
      (b) => {
        setBike(b);
        // New service: start the odometer at the bike's current reading.
        if (!isEdit && b && !prefilled.current) {
          prefilled.current = true;
          setValues((v) => (v.odometerKm === '' ? { ...v, odometerKm: String(b.odometerKm) } : v));
        }
      },
      (e) => setLoadError(toGarageErrorMessage(e))
    );
  }, [uid, bikeId, isEdit]);

  // Edit: load the service once.
  useEffect(() => {
    if (!uid || !serviceId) return;
    let cancelled = false;
    getService(uid, serviceId).then(
      (service) => {
        if (cancelled) return;
        if (!service || service.bikeId !== bikeId) {
          setServiceMissing(true);
          return;
        }
        setValues(toFormValues(service));
        setServiceLoaded(true);
      },
      (e) => {
        if (!cancelled) setLoadError(toGarageErrorMessage(e));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uid, serviceId, bikeId]);

  const loadState: ServiceFormLoadState =
    !bikeId || bike === null || serviceMissing
      ? 'notFound'
      : bike === undefined || (isEdit && !serviceLoaded)
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  const bikeYear = bike?.year;
  const { errors, input } = useMemo(
    () => validateServiceForm(values, bikeId, bikeYear),
    [values, bikeId, bikeYear]
  );
  const minimumDate = useMemo(() => earliestServiceDate(bikeYear), [bikeYear]);
  const maximumDate = latestServiceDate();

  // Show a field's error once the user has left it, or after they tried to save.
  const visibleErrors: ServiceFormErrors = {};
  for (const key of Object.keys(errors) as ServiceFormField[]) {
    if (submitted || touched[key]) visibleErrors[key] = errors[key];
  }

  const typedKm = parseWholeNumber(values.odometerKm);
  const bikeName = bike ? bikeDisplayName(bike) : 'this motorcycle';
  const odometerHint =
    bike && typedKm !== null && typedKm > bike.odometerKm
      ? `Saving also updates ${bikeName}’s odometer from ${formatKm(bike.odometerKm)} to ${formatKm(typedKm)} km.`
      : 'The reading on the dashboard when the work was done.';

  function setField(field: Exclude<ServiceFormField, 'type' | 'date'>, text: string) {
    setValues((v) => ({ ...v, [field]: text }));
  }

  function setType(type: ServiceType) {
    setValues((v) => ({ ...v, type }));
    setTouched((t) => ({ ...t, type: true }));
  }

  function setDate(date: Date) {
    setValues((v) => ({ ...v, date: startOfDay(date) }));
    setTouched((t) => ({ ...t, date: true }));
  }

  function blurField(field: ServiceFormField) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function save() {
    setSubmitted(true);
    if (!uid || !bike || !input || pending) return;
    setPending('save');
    setError(null);
    try {
      if (serviceId) await updateService(uid, serviceId, input, bike.odometerKm);
      else await createService(uid, input, bike.odometerKm);
      closeServiceScreen();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setPending(null);
    }
  }

  /** Deletes without asking; the view confirms first. */
  async function remove() {
    if (!uid || !serviceId || pending) return;
    setPending('delete');
    setError(null);
    try {
      await deleteService(uid, serviceId);
      closeServiceScreen();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setPending(null);
    }
  }

  return {
    isEdit,
    bikeName,
    values,
    errors: visibleErrors,
    odometerHint,
    minimumDate,
    maximumDate,
    loadState,
    pending,
    error: error ?? loadError,
    setField,
    setType,
    setDate,
    blurField,
    save,
    remove,
    cancel: closeServiceScreen,
  };
}

export type ServiceFormViewModel = ReturnType<typeof useServiceFormViewModel>;
