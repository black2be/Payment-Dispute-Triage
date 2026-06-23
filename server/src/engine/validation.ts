import type { PaymentTypeCode, IssueCategoryCode, TransactionStatusCode } from './types.js';

const VALID_PAYMENT_TYPES: PaymentTypeCode[] = ['CARD_PAYMENT', 'EFT', 'INTERNAL_TRANSFER'];
const VALID_ISSUE_CATEGORIES: IssueCategoryCode[] = ['DUPLICATE_DEBIT', 'FAILED_TRANSFER', 'MISSING_PAYMENT', 'UNAUTHORIZED_TRANSACTION'];
const VALID_STATUSES: TransactionStatusCode[] = ['COMPLETED', 'PENDING', 'FAILED', 'REVERSED'];

export interface ValidationError {
  field: string;
  message: string;
}

export function validate(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.customerId || typeof body.customerId !== 'string') {
    errors.push({ field: 'customerId', message: 'Customer ID is required.' });
  }
  if (!body.transactionId || typeof body.transactionId !== 'string') {
    errors.push({ field: 'transactionId', message: 'Transaction ID is required.' });
  }
  if (!body.paymentType || !VALID_PAYMENT_TYPES.includes(body.paymentType as PaymentTypeCode)) {
    errors.push({ field: 'paymentType', message: `Payment type must be one of: ${VALID_PAYMENT_TYPES.join(', ')}` });
  }
  if (!body.issueCategory || !VALID_ISSUE_CATEGORIES.includes(body.issueCategory as IssueCategoryCode)) {
    errors.push({ field: 'issueCategory', message: `Issue category must be one of: ${VALID_ISSUE_CATEGORIES.join(', ')}` });
  }
  if (body.transactionStatus && !VALID_STATUSES.includes(body.transactionStatus as TransactionStatusCode)) {
    errors.push({ field: 'transactionStatus', message: `Transaction status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (body.amount == null || typeof body.amount !== 'number' || body.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number.' });
  }
  if (!body.transactionDate || typeof body.transactionDate !== 'string') {
    errors.push({ field: 'transactionDate', message: 'Transaction date is required (ISO format).' });
  } else {
    const today = new Date().toISOString().split('T')[0]!;
    if (body.transactionDate > today) {
      errors.push({ field: 'transactionDate', message: 'Transaction date cannot be in the future.' });
    }
  }

  return errors;
}
