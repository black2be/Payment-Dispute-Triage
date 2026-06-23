import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { recommend } from '../../src/engine/actionRecommender';
import { triage } from '../../src/engine/triage';
import type { DisputeInput, RecommendedAction, AgeBand, Priority } from '../../src/engine/types';

const paymentTypes = ['Card Payment', 'EFT', 'Internal Transfer'] as const;
const issueCategories = ['Duplicate Debit', 'Failed Transfer', 'Missing Payment', 'Unauthorized Transaction'] as const;
const statuses = ['Completed', 'Pending', 'Failed', 'Reversed'] as const;
const ageBands: AgeBand[] = ['Recent', 'Moderate', 'Aged'];
const priorities: Priority[] = ['High', 'Medium', 'Low'];
const validActions: RecommendedAction[] = [
  'Resolve Immediately', 'Investigate Further', 'Escalate', 'Refer to Another Team',
];

function arbDisputeInput(): fc.Arbitrary<DisputeInput> {
  return fc.record({
    transactionId: fc.string({ minLength: 1, maxLength: 10 }),
    paymentType: fc.constantFrom(...paymentTypes),
    issueCategory: fc.constantFrom(...issueCategories),
    transactionStatus: fc.constantFrom(...statuses),
    amount: fc.double({ min: 0.01, max: 100_000, noNaN: true }),
    disputeDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-06-23') }).map(
      (d) => d.toISOString().split('T')[0]!
    ),
  });
}

// P4 — action determinism (REQ-04)
describe('P4: action determinism', () => {
  it('returns exactly one valid action per input, never zero', () => {
    fc.assert(
      fc.property(
        arbDisputeInput(),
        fc.constantFrom(...ageBands),
        fc.constantFrom(...priorities),
        (input, ageBand, priority) => {
          const result = recommend(input, { ageBand, ageDays: 5, priority });
          expect(validActions).toContain(result.action);
          expect(result.triggeredRuleId).toBeTruthy();
        }
      ),
      { numRuns: 200 }
    );
  });
});

// P5 — rule precedence (REQ-04)
describe('P5: rule precedence — action equals first matching rule R1→R6', () => {
  it('triggered rule is the first matched in evaluations', () => {
    fc.assert(
      fc.property(
        arbDisputeInput(),
        fc.constantFrom(...ageBands),
        fc.constantFrom(...priorities),
        (input, ageBand, priority) => {
          const result = recommend(input, { ageBand, ageDays: 5, priority });
          const firstMatched = result.ruleEvaluations.find((e) => e.matched);
          expect(firstMatched).toBeDefined();
          expect(firstMatched!.ruleId).toBe(result.triggeredRuleId);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Purity — same input + same today → deeply-equal output
describe('Purity', () => {
  it('same input + same today evaluated twice → deeply-equal output', () => {
    fc.assert(
      fc.property(arbDisputeInput(), (input) => {
        const today = '2026-06-23';
        const r1 = triage(input, today);
        const r2 = triage(input, today);
        expect(r1).toStrictEqual(r2);
      }),
      { numRuns: 200 }
    );
  });
});
