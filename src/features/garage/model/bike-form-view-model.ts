import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { createBike, deleteBike, getBike, updateBike } from '@/lib/firestore/bikes';

import {
  type BikeFormErrors,
  type BikeFormField,
  type BikeFormValues,
  EMPTY_BIKE_FORM,
  toFormValues,
  validateBikeForm,
} from './bike-form';
import { toGarageErrorMessage } from './errors';

export type BikeFormLoadState = 'loading' | 'ready' | 'notFound' | 'error';
export type BikeFormPending = 'save' | 'delete' | null;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/garage');
}

/** Add a new bike (no bikeId) or edit / delete an existing one. */
export function useBikeFormViewModel(bikeId: string | undefined) {
  const { user } = useAuth();
  const uid = user?.uid;
  const isEdit = bikeId !== undefined;

  const [values, setValues] = useState<BikeFormValues>(EMPTY_BIKE_FORM);
  const [touched, setTouched] = useState<Partial<Record<BikeFormField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loadState, setLoadState] = useState<BikeFormLoadState>(isEdit ? 'loading' : 'ready');
  const [pending, setPending] = useState<BikeFormPending>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !bikeId) return;
    let cancelled = false;
    getBike(uid, bikeId).then(
      (bike) => {
        if (cancelled) return;
        if (!bike) {
          setLoadState('notFound');
          return;
        }
        setValues(toFormValues(bike));
        setLoadState('ready');
      },
      (e) => {
        if (cancelled) return;
        setError(toGarageErrorMessage(e));
        setLoadState('error');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uid, bikeId]);

  const { errors, input } = useMemo(() => validateBikeForm(values), [values]);

  // Show a field's error once the user has left it, or after they tried to save.
  const visibleErrors: BikeFormErrors = {};
  for (const key of Object.keys(errors) as BikeFormField[]) {
    if (submitted || touched[key]) visibleErrors[key] = errors[key];
  }

  function setField(field: BikeFormField, text: string) {
    setValues((v) => ({ ...v, [field]: text }));
  }

  function blurField(field: BikeFormField) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function save() {
    setSubmitted(true);
    if (!uid || !input || pending) return;
    setPending('save');
    setError(null);
    try {
      if (bikeId) await updateBike(uid, bikeId, input);
      else await createBike(uid, input);
      close();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setPending(null);
    }
  }

  /** Deletes without asking; the view confirms first. */
  async function remove() {
    if (!uid || !bikeId || pending) return;
    setPending('delete');
    setError(null);
    try {
      await deleteBike(uid, bikeId);
      close();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setPending(null);
    }
  }

  return {
    isEdit,
    values,
    errors: visibleErrors,
    loadState,
    pending,
    error,
    displayName: values.nickname.trim() || `${values.make} ${values.model}`.trim() || 'this motorcycle',
    setField,
    blurField,
    save,
    remove,
    cancel: close,
  };
}

export type BikeFormViewModel = ReturnType<typeof useBikeFormViewModel>;
