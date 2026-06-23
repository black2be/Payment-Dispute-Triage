import { describe, it, expect } from 'vitest';
import { triage } from '../../src/engine/triage';
import type { DisputeInput, Priority, RecommendedAction } from '../../src/engine/types';

/**
 * Worked examples from design.md §3.4 (cases A–G).
 * Each must reproduce the documented priority + triggered rule + action.
 */
interface WorkedCase {
  name: string;
  input: DisputeInput;
  today: string;
  expectedPriority: Priority;
  expectedRule: string;
  expectedAction: RecommendedAction;
}

// Helper: today = '2026-06-23', so age = today - disputeDate
const TODAY = '2026-06-23';

const cases: WorkedCase[] = [
  {
    // A: Card / Unauthorized / R3,200 / Completed / 3 (Recent) → High / R6 / Refer
    name: 'Case A',
    input: {
      transactionId: 'A', paymentType: 'Card Payment',
      issueCategory: 'Unauthorized Transaction', transactionStatus: 'Completed',
      amount: 3200, disputeDate: '2026-06-20', // 3 days
    },
    today: TODAY,
    expectedPriority: 'High',
    expectedRule: 'R6-DEFAULT',
    expectedAction: 'Refer to Another Team',
  },
  {
    // B: EFT / Failed Transfer / R8,000 / Failed / 2 (Recent) → Medium / R1 / Resolve
    name: 'Case B',
    input: {
      transactionId: 'B', paymentType: 'EFT',
      issueCategory: 'Failed Transfer', transactionStatus: 'Failed',
      amount: 8000, disputeDate: '2026-06-21', // 2 days
    },
    today: TODAY,
    expectedPriority: 'Medium',
    expectedRule: 'R1-FAILED-RECENT',
    expectedAction: 'Resolve Immediately',
  },
  {
    // C: EFT / Missing Payment / R12,500 / Pending / 10 (Moderate) → High / R4 / Investigate
    name: 'Case C',
    input: {
      transactionId: 'C', paymentType: 'EFT',
      issueCategory: 'Missing Payment', transactionStatus: 'Pending',
      amount: 12500, disputeDate: '2026-06-13', // 10 days
    },
    today: TODAY,
    expectedPriority: 'High',
    expectedRule: 'R4-MISSING-EFT',
    expectedAction: 'Investigate Further',
  },
  {
    // D: Card / Duplicate Debit / R600 / Completed / 1 (Recent) → Low / R2 / Investigate
    name: 'Case D',
    input: {
      transactionId: 'D', paymentType: 'Card Payment',
      issueCategory: 'Duplicate Debit', transactionStatus: 'Completed',
      amount: 600, disputeDate: '2026-06-22', // 1 day
    },
    today: TODAY,
    expectedPriority: 'Low',
    expectedRule: 'R2-DUP-COMPLETED',
    expectedAction: 'Investigate Further',
  },
  {
    // E: Internal / Unauthorized / R45,000 / Completed / 40 (Aged) → High / R3 / Escalate
    name: 'Case E',
    input: {
      transactionId: 'E', paymentType: 'Internal Transfer',
      issueCategory: 'Unauthorized Transaction', transactionStatus: 'Completed',
      amount: 45000, disputeDate: '2026-05-14', // 40 days
    },
    today: TODAY,
    expectedPriority: 'High',
    expectedRule: 'R3-UNAUTH-HIGHVAL',
    expectedAction: 'Escalate',
  },
  {
    // F: Card / Missing Payment / R20,000 / Reversed / 35 (Aged) → High / R5 / Escalate
    name: 'Case F',
    input: {
      transactionId: 'F', paymentType: 'Card Payment',
      issueCategory: 'Missing Payment', transactionStatus: 'Reversed',
      amount: 20000, disputeDate: '2026-05-19', // 35 days
    },
    today: TODAY,
    expectedPriority: 'High',
    expectedRule: 'R5-AGED-HIGH',
    expectedAction: 'Escalate',
  },
  {
    // G: Internal / Failed Transfer / R5,000 / Completed / 15 (Moderate) → Medium / R6 / Refer
    name: 'Case G',
    input: {
      transactionId: 'G', paymentType: 'Internal Transfer',
      issueCategory: 'Failed Transfer', transactionStatus: 'Completed',
      amount: 5000, disputeDate: '2026-06-08', // 15 days
    },
    today: TODAY,
    expectedPriority: 'Medium',
    expectedRule: 'R6-DEFAULT',
    expectedAction: 'Refer to Another Team',
  },
];

describe('Worked examples (design §3.4, cases A–G)', () => {
  it.each(cases)('$name → $expectedAction via $expectedRule', (c) => {
    const result = triage(c.input, c.today);
    expect(result.priority).toBe(c.expectedPriority);
    expect(result.triggeredRuleId).toBe(c.expectedRule);
    expect(result.action).toBe(c.expectedAction);
  });
});
