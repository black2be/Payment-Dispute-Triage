import { HIGH_AMOUNT } from './constants';
import type { DisputeInput, Priority, AgeBand } from './types';

/** Determine priority — highest match wins, default Medium. */
export function determinePriority(
  input: DisputeInput,
  ageBand: AgeBand
): Priority {
  // High: unauthorized, high-value, or aged
  if (input.issueCategory === 'Unauthorized Transaction') return 'High';
  if (input.amount >= HIGH_AMOUNT) return 'High';
  if (ageBand === 'Aged') return 'High';

  // Low: small amount and recent
  if (input.amount < 500 && ageBand === 'Recent') return 'Low';

  return 'Medium';
}
