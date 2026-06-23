// DB/API code-form enums (design.md §2.1)
export type PaymentTypeCode = 'CARD_PAYMENT' | 'EFT' | 'INTERNAL_TRANSFER';
export type IssueCategoryCode = 'DUPLICATE_DEBIT' | 'FAILED_TRANSFER' | 'MISSING_PAYMENT' | 'UNAUTHORIZED_TRANSACTION';
export type TransactionStatusCode = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
export type PriorityCode = 'HIGH' | 'MEDIUM' | 'LOW';
export type AgeBandCode = 'RECENT' | 'MODERATE' | 'AGED';
export type RecommendedActionCode = 'RESOLVE_IMMEDIATELY' | 'INVESTIGATE_FURTHER' | 'ESCALATE' | 'REFER_TO_ANOTHER_TEAM';

export interface TriageInput {
  paymentType: PaymentTypeCode;
  issueCategory: IssueCategoryCode;
  transactionStatus: TransactionStatusCode;
  amount: number;
  transactionDate: string; // ISO date
}

export interface RuleEvaluation {
  ruleId: string;
  label: string;
  matched: boolean;
  reason?: string;
}

export interface TriageResult {
  action: RecommendedActionCode;
  priority: PriorityCode;
  ageBand: AgeBandCode;
  ageDays: number;
  triggeredRuleId: string;
  reason: string;
  ruleEvaluations: RuleEvaluation[];
}
