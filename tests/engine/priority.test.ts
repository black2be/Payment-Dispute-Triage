import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { determinePriority } from '../../src/engine/priorityCalculator';
import { HIGH_AMOUNT, LOW_AMOUNT } from '../../src/engine/constants';
import type { DisputeInput, AgeBand } from '../../src/engine/types';

const ageBands: AgeBand[] = ['Recent', 'Moderate', 'Aged'];
const paymentTypes = ['Card Payment', 'EFT', 'Internal Transfer'] as const;
const issueCategories = ['Duplicate Debit', 'Failed Transfer', 'Missing Payment', 'Unauthorized Transaction'] as const;
const statuses = ['Completed', 'Pending', 'Failed', 'Reversed'] as const;

function arbDisputeInput(): fc.Arbitrary<DisputeInput> {
  return fc.record({
    transactionId: fc.string({ minLength: 1, maxLength: 10 }),
    paymentType: fc.constantFrom(...paymentTypes),
    issueCategory: fc.constantFrom(...issueCategories),
    transactionStatus: fc.constantFrom(...statuses),
    amount: fc.double({ min: 0.01, max: 100_000, noNaN: true }),
    disputeDate: fc.constant('2026-06-01'),
  });
}

// P3 — priority assignment (REQ-03)
describe('P3: priority assignment', () => {
  it('High always wins for amount > 10,000 OR Unauthorized', () => {
    fc.assert(
      fc.property(arbDisputeInput(), fc.constantFrom(...ageBands), (input, ageBand) => {
        const priority = determinePriority(input, ageBand);
        if (input.amount > HIGH_AMOUNT || input.issueCategory === 'Unauthorized Transaction') {
          expect(priority).toBe('High');
        }
      }),
      { numRuns: 200 }
    );
  });

  it('result is always one of High, Medium, Low', () => {
    fc.assert(
      fc.property(arbDisputeInput(), fc.constantFrom(...ageBands), (input, ageBand) => {
        const priority = determinePriority(input, ageBand);
        expect(['High', 'Medium', 'Low']).toContain(priority);
      }),
      { numRuns: 200 }
    );
  });

  // Boundary: amount 999.99 + Recent → Low; 1,000 + Moderate → Medium; 10,000 + Moderate → Medium; 10,000.01 → High
  it('amount 999.99 + Recent → Low', () => {
    const input: DisputeInput = {
      transactionId: 'T1', paymentType: 'EFT', issueCategory: 'Duplicate Debit',
      transactionStatus: 'Completed', amount: 999.99, disputeDate: '2026-06-20',
    };
    expect(determinePriority(input, 'Recent')).toBe('Low');
  });

  it('amount 1000 + Moderate → Medium', () => {
    const input: DisputeInput = {
      transactionId: 'T1', paymentType: 'EFT', issueCategory: 'Duplicate Debit',
      transactionStatus: 'Completed', amount: 1000, disputeDate: '2026-06-20',
    };
    expect(determinePriority(input, 'Moderate')).toBe('Medium');
  });

  it('amount 10000 + Moderate → Medium', () => {
    const input: DisputeInput = {
      transactionId: 'T1', paymentType: 'EFT', issueCategory: 'Duplicate Debit',
      transactionStatus: 'Completed', amount: 10000, disputeDate: '2026-06-20',
    };
    expect(determinePriority(input, 'Moderate')).toBe('Medium');
  });

  it('amount 10000.01 → High', () => {
    const input: DisputeInput = {
      transactionId: 'T1', paymentType: 'EFT', issueCategory: 'Duplicate Debit',
      transactionStatus: 'Completed', amount: 10000.01, disputeDate: '2026-06-20',
    };
    expect(determinePriority(input, 'Recent')).toBe('High');
  });
});
