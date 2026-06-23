import type { TriageInput, TriageResult } from './types.js';
import { calculateAge, classifyAgeBand } from './ageCalculator.js';
import { determinePriority } from './priorityCalculator.js';
import { recommend } from './actionRecommender.js';

export function triage(input: TriageInput, today: string): TriageResult {
  const ageDays = calculateAge(input.transactionDate, today);
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
