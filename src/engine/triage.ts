import type { DisputeInput, TriageResult } from './types';
import { calculateAge, classifyAgeBand } from './ageCalculator';
import { determinePriority } from './priorityCalculator';
import { recommend } from './actionRecommender';

/**
 * Main orchestrator — pure function.
 * Same input + same `today` → same result (deterministic).
 */
export function triage(input: DisputeInput, today: string): TriageResult {
  const ageDays = calculateAge(input.disputeDate, today);
  const ageBand = classifyAgeBand(ageDays);
  const priority = determinePriority(input, ageBand);
  const result = recommend(input, { ageBand, ageDays, priority });

  return {
    action: result.action,
    priority,
    ageBand,
    ageDays,
    triggeredRuleId: result.triggeredRuleId,
    reason: result.reason,
    ruleEvaluations: result.ruleEvaluations,
  };
}
