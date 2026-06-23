import { HIGH_AMOUNT, LOW_AMOUNT } from './constants.js';
import type { TriageInput, PriorityCode, AgeBandCode } from './types.js';

export function determinePriority(input: TriageInput, ageBand: AgeBandCode): PriorityCode {
  if (input.amount > HIGH_AMOUNT) return 'HIGH';
  if (input.issueCategory === 'UNAUTHORIZED_TRANSACTION') return 'HIGH';
  if (input.amount >= LOW_AMOUNT && input.amount <= HIGH_AMOUNT && (ageBand === 'MODERATE' || ageBand === 'AGED')) return 'MEDIUM';
  if (input.amount < LOW_AMOUNT && ageBand === 'RECENT') return 'LOW';
  return 'MEDIUM';
}
