import { HIGH_AMOUNT } from './constants';
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

// design.md §3.3 — first match wins (R1→R6)
const rules: Rule[] = [
  {
    // R1: status = FAILED ∧ ageBand = Recent
    id: 'R1-FAILED-RECENT',
    label: 'Failed transaction, recent',
    test: (i, ctx) => i.transactionStatus === 'Failed' && ctx.ageBand === 'Recent',
    action: 'Resolve Immediately',
    reason: () => 'Failed transaction within 7 days — safe to resolve now.',
  },
  {
    // R2: category = DUPLICATE_DEBIT ∧ status = COMPLETED
    id: 'R2-DUP-COMPLETED',
    label: 'Duplicate debit, completed',
    test: (i) =>
      i.issueCategory === 'Duplicate Debit' &&
      i.transactionStatus === 'Completed',
    action: 'Investigate Further',
    reason: () => 'Duplicate debit on a completed transaction — investigate further.',
  },
  {
    // R3: category = UNAUTHORIZED_TRANSACTION ∧ amount > 10,000
    id: 'R3-UNAUTH-HIGHVAL',
    label: 'Unauthorized, high value',
    test: (i) =>
      i.issueCategory === 'Unauthorized Transaction' &&
      i.amount > HIGH_AMOUNT,
    action: 'Escalate',
    reason: (i) =>
      `Unauthorized transaction of R${i.amount.toLocaleString()} (>${HIGH_AMOUNT.toLocaleString()}) — escalate.`,
  },
  {
    // R4: category = MISSING_PAYMENT ∧ type = EFT
    id: 'R4-MISSING-EFT',
    label: 'Missing payment, EFT',
    test: (i) =>
      i.issueCategory === 'Missing Payment' && i.paymentType === 'EFT',
    action: 'Investigate Further',
    reason: () => 'Missing EFT payment — investigate further.',
  },
  {
    // R5: ageBand = Aged ∧ priority = High
    id: 'R5-AGED-HIGH',
    label: 'Aged and high priority',
    test: (_i, ctx) => ctx.ageBand === 'Aged' && ctx.priority === 'High',
    action: 'Escalate',
    reason: (_i, ctx) => `Dispute is ${ctx.ageDays} days old with high priority — escalate.`,
  },
  {
    // R6: none of the above
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
