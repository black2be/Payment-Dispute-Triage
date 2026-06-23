// Domain enums — string values must match design.md glossary exactly

export type PaymentType = 'Card Payment' | 'EFT' | 'Internal Transfer';

export type IssueCategory =
  | 'Duplicate Debit'
  | 'Failed Transfer'
  | 'Missing Payment'
  | 'Unauthorized Transaction';

export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Reversed';

export type Priority = 'High' | 'Medium' | 'Low';

export type AgeBand = 'Recent' | 'Moderate' | 'Aged';

export type RecommendedAction =
  | 'Resolve Immediately'
  | 'Investigate Further'
  | 'Escalate'
  | 'Refer to Another Team';

export interface DisputeInput {
  transactionId: string;
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  amount: number;
  disputeDate: string; // ISO date string YYYY-MM-DD
}

export interface RuleEvaluation {
  ruleId: string;
  label: string;
  matched: boolean;
  reason?: string;
}

export interface TriageResult {
  action: RecommendedAction;
  priority: Priority;
  ageBand: AgeBand;
  ageDays: number;
  triggeredRuleId: string;
  reason: string;
  ruleEvaluations: RuleEvaluation[];
}
