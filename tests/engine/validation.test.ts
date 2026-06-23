import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validate } from '../../src/engine/validation';
import type { DisputeInput } from '../../src/engine/types';

const mandatoryFields = [
  'transactionId',
  'paymentType',
  'issueCategory',
  'transactionStatus',
  'amount',
  'disputeDate',
] as const;

// P6 — validation completeness (REQ-01)
describe('P6: validation completeness', () => {
  it('any incomplete subset of mandatory fields is rejected and each missing field named', () => {
    fc.assert(
      fc.property(
        fc.subarray(mandatoryFields as unknown as string[], { minLength: 1 }),
        (fieldsToRemove) => {
          const fullInput: Record<string, unknown> = {
            transactionId: 'TXN-001',
            paymentType: 'EFT',
            issueCategory: 'Duplicate Debit',
            transactionStatus: 'Completed',
            amount: 1000,
            disputeDate: '2026-06-01',
          };

          for (const f of fieldsToRemove) {
            if (f === 'amount') {
              fullInput[f] = 0; // invalid amount
            } else {
              fullInput[f] = ''; // empty string
            }
          }

          const errors = validate(fullInput as Partial<DisputeInput>);
          expect(errors.length).toBeGreaterThan(0);

          const errorFields = errors.map((e) => e.field);
          for (const f of fieldsToRemove) {
            expect(errorFields).toContain(f);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a valid complete input returns no errors', () => {
    const input: DisputeInput = {
      transactionId: 'TXN-001',
      paymentType: 'EFT',
      issueCategory: 'Duplicate Debit',
      transactionStatus: 'Completed',
      amount: 1000,
      disputeDate: '2026-06-01',
    };
    expect(validate(input)).toHaveLength(0);
  });
});
