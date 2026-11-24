import { useMemo, useState } from 'react';

import { parseWholeNumber } from '@/features/garage/model/bike-form';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { formatKm } from '@/features/garage/model/odometer';
import { useAuth } from '@/hooks/use-auth';
import { SERVICE_INTERVAL_LIMITS, type ServiceIntervals, type ServiceType } from '@/lib/firestore/types';
import { setServiceIntervals } from '@/lib/firestore/user-profile';

import { DEFAULT_SERVICE_INTERVALS, isValidInterval } from './intervals';
import { closeServiceScreen } from './navigation';
import { SERVICE_TYPE_ORDER } from './service-form';
import { useServiceIntervals } from './use-service-intervals';

type IntervalValues = Record<ServiceType, string>;
type IntervalErrors = Partial<Record<ServiceType, string>>;

function toValues(intervals: ServiceIntervals): IntervalValues {
  const values = {} as IntervalValues;
  for (const type of SERVICE_TYPE_ORDER) values[type] = intervals[type] === null ? '' : String(intervals[type]);
  return values;
}

/** Empty means no reminder; anything else must be a whole number of km in range. */
export function validateIntervals(values: IntervalValues): { errors: IntervalErrors; intervals: ServiceIntervals | null } {
  const errors: IntervalErrors = {};
  const intervals = { ...DEFAULT_SERVICE_INTERVALS };
  for (const type of SERVICE_TYPE_ORDER) {
    const text = values[type].trim();
    if (!text) {
      intervals[type] = null;
      continue;
    }
    const km = parseWholeNumber(text);
    if (!isValidInterval(km)) {
      errors[type] = `Enter a whole number from ${formatKm(SERVICE_INTERVAL_LIMITS.minKm)} to ${formatKm(SERVICE_INTERVAL_LIMITS.maxKm)} km, or leave it empty.`;
    } else {
      intervals[type] = km;
    }
  }
  return { errors, intervals: Object.keys(errors).length > 0 ? null : intervals };
}

/** Edit the km between services of each type. */
export function useServiceIntervalsViewModel() {
  const { user } = useAuth();
  const { intervals, loaded } = useServiceIntervals();
  /** null until the user edits something; until then the form shows the saved intervals. */
  const [edited, setEdited] = useState<IntervalValues | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const values = useMemo(() => edited ?? toValues(intervals), [edited, intervals]);
  const { errors, intervals: input } = useMemo(() => validateIntervals(values), [values]);
  const isDefault = SERVICE_TYPE_ORDER.every((type) => values[type] === toValues(DEFAULT_SERVICE_INTERVALS)[type]);

  function setValue(type: ServiceType, text: string) {
    setEdited({ ...values, [type]: text });
  }

  async function save() {
    setSubmitted(true);
    if (!user || !input || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setServiceIntervals(user, input);
      closeServiceScreen();
    } catch (e) {
      setError(toGarageErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading: !loaded,
    values,
    /** Shown after the first save attempt, so typing isn't interrupted. */
    errors: submitted ? errors : {},
    defaults: DEFAULT_SERVICE_INTERVALS,
    isDefault,
    saving,
    error,
    setValue,
    resetToDefaults: () => setEdited(toValues(DEFAULT_SERVICE_INTERVALS)),
    save,
    cancel: closeServiceScreen,
  };
}

export type ServiceIntervalsViewModel = ReturnType<typeof useServiceIntervalsViewModel>;
