import type { DisputeInput } from '../engine/types';

export interface MockTransaction extends DisputeInput {
  customerName: string;
  description: string;
}

/**
 * 15 mock transactions covering all payment types, issue categories,
 * statuses, and amount ranges for demo purposes.
 * No real PII — all identifiers are fictional.
 */
export const mockTransactions: MockTransaction[] = [
  {
    transactionId: 'TXN-001',
    customerName: 'Customer Alpha',
    paymentType: 'Card Payment',
    issueCategory: 'Unauthorized Transaction',
    transactionStatus: 'Completed',
    amount: 12500,
    disputeDate: '2026-06-20',
    description: 'High-value unauthorized card purchase',
  },
  {
    transactionId: 'TXN-002',
    customerName: 'Customer Beta',
    paymentType: 'EFT',
    issueCategory: 'Failed Transfer',
    transactionStatus: 'Failed',
    amount: 3200,
    disputeDate: '2026-06-21',
    description: 'EFT failed but funds debited',
  },
  {
    transactionId: 'TXN-003',
    customerName: 'Customer Gamma',
    paymentType: 'Internal Transfer',
    issueCategory: 'Duplicate Debit',
    transactionStatus: 'Completed',
    amount: 250,
    disputeDate: '2026-06-22',
    description: 'Low-value duplicate on completed transfer',
  },
  {
    transactionId: 'TXN-004',
    customerName: 'Customer Delta',
    paymentType: 'Card Payment',
    issueCategory: 'Missing Payment',
    transactionStatus: 'Pending',
    amount: 780,
    disputeDate: '2026-06-10',
    description: 'Payment not received by merchant',
  },
  {
    transactionId: 'TXN-005',
    customerName: 'Customer Epsilon',
    paymentType: 'EFT',
    issueCategory: 'Unauthorized Transaction',
    transactionStatus: 'Completed',
    amount: 6800,
    disputeDate: '2026-05-15',
    description: 'Aged unauthorized EFT — high priority',
  },
  {
    transactionId: 'TXN-006',
    customerName: 'Customer Zeta',
    paymentType: 'Card Payment',
    issueCategory: 'Duplicate Debit',
    transactionStatus: 'Completed',
    amount: 150,
    disputeDate: '2026-06-23',
    description: 'Small duplicate charge today',
  },
  {
    transactionId: 'TXN-007',
    customerName: 'Customer Eta',
    paymentType: 'Internal Transfer',
    issueCategory: 'Failed Transfer',
    transactionStatus: 'Failed',
    amount: 4500,
    disputeDate: '2026-06-18',
    description: 'Recent failed internal transfer',
  },
  {
    transactionId: 'TXN-008',
    customerName: 'Customer Theta',
    paymentType: 'EFT',
    issueCategory: 'Missing Payment',
    transactionStatus: 'Pending',
    amount: 9200,
    disputeDate: '2026-05-01',
    description: 'High-value aged missing EFT payment',
  },
  {
    transactionId: 'TXN-009',
    customerName: 'Customer Iota',
    paymentType: 'Card Payment',
    issueCategory: 'Duplicate Debit',
    transactionStatus: 'Reversed',
    amount: 320,
    disputeDate: '2026-06-19',
    description: 'Duplicate already reversed',
  },
  {
    transactionId: 'TXN-010',
    customerName: 'Customer Kappa',
    paymentType: 'Internal Transfer',
    issueCategory: 'Unauthorized Transaction',
    transactionStatus: 'Completed',
    amount: 1500,
    disputeDate: '2026-06-12',
    description: 'Medium-value unauthorized internal transfer',
  },
  {
    transactionId: 'TXN-011',
    customerName: 'Customer Lambda',
    paymentType: 'EFT',
    issueCategory: 'Failed Transfer',
    transactionStatus: 'Failed',
    amount: 50,
    disputeDate: '2026-06-22',
    description: 'Low-value recent failed EFT',
  },
  {
    transactionId: 'TXN-012',
    customerName: 'Customer Mu',
    paymentType: 'Card Payment',
    issueCategory: 'Missing Payment',
    transactionStatus: 'Completed',
    amount: 2100,
    disputeDate: '2026-06-05',
    description: 'Moderate-age missing card payment',
  },
  {
    transactionId: 'TXN-013',
    customerName: 'Customer Nu',
    paymentType: 'Internal Transfer',
    issueCategory: 'Duplicate Debit',
    transactionStatus: 'Completed',
    amount: 7500,
    disputeDate: '2026-06-01',
    description: 'High-value duplicate internal transfer',
  },
  {
    transactionId: 'TXN-014',
    customerName: 'Customer Xi',
    paymentType: 'EFT',
    issueCategory: 'Unauthorized Transaction',
    transactionStatus: 'Pending',
    amount: 430,
    disputeDate: '2026-06-20',
    description: 'Low-value unauthorized EFT still pending',
  },
  {
    transactionId: 'TXN-015',
    customerName: 'Customer Omicron',
    paymentType: 'Card Payment',
    issueCategory: 'Failed Transfer',
    transactionStatus: 'Failed',
    amount: 1800,
    disputeDate: '2026-04-15',
    description: 'Old failed card transaction — aged',
  },
];

/** Look up a transaction by ID. */
export function lookupTransaction(transactionId: string): MockTransaction | undefined {
  return mockTransactions.find((t) => t.transactionId === transactionId);
}
