import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { lookupTransaction, mockTransactions } from '../../src/data/mockTransactions';

// P7 — mock lookup (REQ-06)
describe('P7: mock lookup', () => {
  it('existing reference returns its record', () => {
    for (const txn of mockTransactions) {
      const result = lookupTransaction(txn.transactionId);
      expect(result).toBeDefined();
      expect(result!.transactionId).toBe(txn.transactionId);
    }
  });

  it('non-existent reference returns undefined', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 20 }).filter(
          (s) => !mockTransactions.some((t) => t.transactionId === s)
        ),
        (id) => {
          expect(lookupTransaction(id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
