import type { DisputeInput } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

/** Validate dispute input fields. Returns empty array if valid. */
export function validate(input: Partial<DisputeInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.transactionId?.trim()) {
    errors.push({ field: 'transactionId', message: 'Transaction ID is required.' });
  }
  if (!input.paymentType) {
    errors.push({ field: 'paymentType', message: 'Payment type is required.' });
  }
  if (!input.issueCategory) {
    errors.push({ field: 'issueCategory', message: 'Issue category is required.' });
  }
  if (!input.transactionStatus) {
    errors.push({ field: 'transactionStatus', message: 'Transaction status is required.' });
  }
  if (input.amount == null || input.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than zero.' });
  }
  if (!input.disputeDate) {
    errors.push({ field: 'disputeDate', message: 'Dispute date is required.' });
  }

  return errors;
}
