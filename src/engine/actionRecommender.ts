import { HIGH_AMOUNT, LOW_AMOUNT } from './constants';
import type {
  DisputeInput,
  RecommendedAction,
  RuleEvaluation,
  AgeBand,
  Priority,
} from './types';

interface RuleContext {
  ageBand: AgeBand;
  ageDays: number;
  priority: Priority;
}

interface Rule {
  id: string;
  label: string;
  test: (input: DisputeInput, ctx: RuleContext) => boolean;
  action: RecommendedAction;
  reason: (input: DisputeInput, ctx: RuleContext) => string;
}

const rules: Rule[] = [
  {
    id: 'R1-FAILED-RECENT',
    label: 'Failed transaction, recent',
    test: (i, ctx) => i.transactionStatus === 'Failed' && ctx.ageBand === 'Recent',
    action: 'Resolve Immediately',
    reason: () => 'Failed transaction within 7 days — safe to resolve now.',
  },
  {
    id: 'R2-LOW-DUP-COMPLETE',
    label: 'Low-value settled duplicate',
    test: (i) =>
      i.issueCategory === 'Duplicate Debit' &&
      i.transactionStatus === 'Completed' &&
      i.amount < LOW_AMOUNT,
    action: 'Resolve Immediately',
    reason: () => 'Low-value duplicate on a completed transaction — resolve immediately.',
  },
  {
    id: 'R3-UNAUTH',
    label: 'Unauthorized transaction',
    test: (i) => i.issueCategory === 'Unauthorized Transaction',
    action: 'Escalate',
    reason: () => 'Unauthorized transaction reported — escalate for fraud review.',
  },
  {
    id: 'R4-HIGH-VALUE',
    label: 'High-value dispute',
    test: (i) => i.amount >= HIGH_AMOUNT,
    action: 'Escalate',
    reason: (i) => `Amount R${i.amount.toLocaleString()} exceeds threshold — escalate.`,
  },
  {
    id: 'R5-AGED-HIGH',
    label: 'Aged and high priority',
    test: (_i, ctx) => ctx.ageBand === 'Aged' && ctx.priority === 'High',
    action: 'Escalate',
    reason: (_i, ctx) => `Dispute is ${ctx.ageDays} days old with high priority — escalate.`,
  },
  {
    id: 'R6-DEFAULT',
    label: 'Default referral',
    test: () => true,
    action: 'Refer to Another Team',
    reason: () => 'No specific rule matched — refer to another team for assessment.',
  },
];

export interface RecommendResult {
  action: RecommendedAction;
  triggeredRuleId: string;
  reason: string;
  ruleEvaluations: RuleEvaluation[];
}

/** Evaluate rules first-match-wins (R1→R6). */
export function recommend(
  input: DisputeInput,
  ctx: RuleContext
): RecommendResult {
  const evaluations: RuleEvaluation[] = [];
  let result: RecommendResult | null = null;

  for (const rule of rules) {
    const matched = rule.test(input, ctx);
    evaluations.push({
      ruleId: rule.id,
      label: rule.label,
      matched,
      reason: matched ? rule.reason(input, ctx) : undefined,
    });

    if (matched && !result) {
      result = {
        action: rule.action,
        triggeredRuleId: rule.id,
        reason: rule.reason(input, ctx),
        ruleEvaluations: [], // filled after loop
      };
    }
  }

  // R6-DEFAULT always matches, so result is never null
  return { ...result!, ruleEvaluations: evaluations };
}
