import { HIGH_AMOUNT } from './constants.js';
import type { TriageInput, RecommendedActionCode, RuleEvaluation, AgeBandCode, PriorityCode } from './types.js';

interface RuleContext {
  ageBand: AgeBandCode;
  ageDays: number;
  priority: PriorityCode;
}

interface Rule {
  id: string;
  label: string;
  test: (input: TriageInput, ctx: RuleContext) => boolean;
  action: RecommendedActionCode;
  reason: (input: TriageInput, ctx: RuleContext) => string;
}

const rules: Rule[] = [
  {
    id: 'R1-FAILED-RECENT',
    label: 'Failed transaction, recent',
    test: (i, ctx) => i.transactionStatus === 'FAILED' && ctx.ageBand === 'RECENT',
    action: 'RESOLVE_IMMEDIATELY',
    reason: () => 'Failed transaction within 7 days — safe to resolve now.',
  },
  {
    id: 'R2-DUP-COMPLETED',
    label: 'Duplicate debit, completed',
    test: (i) => i.issueCategory === 'DUPLICATE_DEBIT' && i.transactionStatus === 'COMPLETED',
    action: 'INVESTIGATE_FURTHER',
    reason: () => 'Duplicate debit on a completed transaction — investigate further.',
  },
  {
    id: 'R3-UNAUTH-HIGHVAL',
    label: 'Unauthorized, high value',
    test: (i) => i.issueCategory === 'UNAUTHORIZED_TRANSACTION' && i.amount > HIGH_AMOUNT,
    action: 'ESCALATE',
    reason: (i) => `Unauthorized transaction of R${i.amount.toLocaleString()} (>${HIGH_AMOUNT.toLocaleString()}) — escalate.`,
  },
  {
    id: 'R4-MISSING-EFT',
    label: 'Missing payment, EFT',
    test: (i) => i.issueCategory === 'MISSING_PAYMENT' && i.paymentType === 'EFT',
    action: 'INVESTIGATE_FURTHER',
    reason: () => 'Missing EFT payment — investigate further.',
  },
  {
    id: 'R5-AGED-HIGH',
    label: 'Aged and high priority',
    test: (_i, ctx) => ctx.ageBand === 'AGED' && ctx.priority === 'HIGH',
    action: 'ESCALATE',
    reason: (_i, ctx) => `Dispute is ${ctx.ageDays} days old with high priority — escalate.`,
  },
  {
    id: 'R6-DEFAULT',
    label: 'Default referral',
    test: () => true,
    action: 'REFER_TO_ANOTHER_TEAM',
    reason: () => 'No specific rule matched — refer to another team for assessment.',
  },
];

export interface RecommendResult {
  action: RecommendedActionCode;
  triggeredRuleId: string;
  reason: string;
  ruleEvaluations: RuleEvaluation[];
}

export function recommend(input: TriageInput, ctx: RuleContext): RecommendResult {
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
        ruleEvaluations: [],
      };
    }
  }

  return { ...result!, ruleEvaluations: evaluations };
}
