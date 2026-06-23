import { HIGH_AMOUNT, LOW_AMOUNT } from './constants';
import type { DisputeInput, Priority, AgeBand } from './types';

/**
 * Determine priority — top-down, highest match wins; default Medium.
 * (design.md §3.2)
 */
export function determinePriority(
  input: DisputeInput,
  ageBand: AgeBand
): Priority {
  // High: amount > 10,000 OR unauthorized
  if (input.amount > HIGH_AMOUNT) return 'High';
  if (input.issueCategory === 'Unauthorized Transaction') return 'High';

  // Medium: 1,000 <= amount <= 10,000 AND ageBand in {Moderate, Aged}
  if (
    input.amount >= LOW_AMOUNT &&
    input.amount <= HIGH_AMOUNT &&
    (ageBand === 'Moderate' || ageBand === 'Aged')
  ) {
    return 'Medium';
  }

  // Low: amount < 1,000 AND ageBand = Recent
  if (input.amount < LOW_AMOUNT && ageBand === 'Recent') return 'Low';

  // Default
  return 'Medium';
}
