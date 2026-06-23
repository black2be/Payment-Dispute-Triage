import { AGE_RECENT_MAX, AGE_MODERATE_MAX } from './constants.js';
import type { AgeBandCode } from './types.js';

export function calculateAge(transactionDate: string, today: string): number {
  const txn = new Date(transactionDate);
  const ref = new Date(today);
  const diffMs = ref.getTime() - txn.getTime();
  if (diffMs < 0) throw new Error('Future date: transaction date is after today');
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function classifyAgeBand(ageDays: number): AgeBandCode {
  if (ageDays <= AGE_RECENT_MAX) return 'RECENT';
  if (ageDays <= AGE_MODERATE_MAX) return 'MODERATE';
  return 'AGED';
}
