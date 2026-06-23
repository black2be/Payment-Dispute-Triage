import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateAge, classifyAgeBand } from '../../src/engine/ageCalculator';
import { AGE_RECENT_MAX, AGE_MODERATE_MAX } from '../../src/engine/constants';

// P1 — age calculation (REQ-02)
describe('P1: age calculation', () => {
  it('returns calendar days between dispute date and today', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2026-06-23') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2026-06-23') }),
        (disputeDate, today) => {
          // Only test when today >= disputeDate
          if (today < disputeDate) return true;
          const dStr = disputeDate.toISOString().split('T')[0]!;
          const tStr = today.toISOString().split('T')[0]!;
          const age = calculateAge(dStr, tStr);
          expect(age).toBeGreaterThanOrEqual(0);
          // Verify it matches calendar day diff
          const expected = Math.floor(
            (new Date(tStr).getTime() - new Date(dStr).getTime()) / (1000 * 60 * 60 * 24)
          );
          expect(age).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('classifies age band correctly for any non-negative day count', () => {
    fc.assert(
      fc.property(fc.nat(365), (days) => {
        const band = classifyAgeBand(days);
        if (days <= AGE_RECENT_MAX) expect(band).toBe('Recent');
        else if (days <= AGE_MODERATE_MAX) expect(band).toBe('Moderate');
        else expect(band).toBe('Aged');
      }),
      { numRuns: 200 }
    );
  });
});

// P2 — future-date rejection (REQ-02)
describe('P2: future-date rejection', () => {
  it('throws for any future date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-06-24'), max: new Date('2030-12-31') }),
        (futureDate) => {
          const fStr = futureDate.toISOString().split('T')[0]!;
          expect(() => calculateAge(fStr, '2026-06-23')).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Boundary cases (TC-044…051)
describe('Boundary cases', () => {
  it('age 7 → Recent', () => expect(classifyAgeBand(7)).toBe('Recent'));
  it('age 8 → Moderate', () => expect(classifyAgeBand(8)).toBe('Moderate'));
  it('age 30 → Moderate', () => expect(classifyAgeBand(30)).toBe('Moderate'));
  it('age 31 → Aged', () => expect(classifyAgeBand(31)).toBe('Aged'));
});
