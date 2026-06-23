import { AGE_RECENT_MAX, AGE_MODERATE_MAX } from './constants';
import type { AgeBand } from './types';

/** Calculate age in calendar days between dispute date and today. */
export function calculateAge(disputeDate: string, today: string): number {
  const dispute = new Date(disputeDate);
  const ref = new Date(today);
  const diffMs = ref.getTime() - dispute.getTime();
  if (diffMs < 0) throw new Error('Future date: dispute date is after today');
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Classify age into band. */
export function classifyAgeBand(ageDays: number): AgeBand {
  if (ageDays <= AGE_RECENT_MAX) return 'Recent';
  if (ageDays <= AGE_MODERATE_MAX) return 'Moderate';
  return 'Aged';
}
