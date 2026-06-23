import { mockTransactions } from './mockTransactions';
import { triage } from '../engine/triage';
import type { CaseRecord } from '../components/CasesList';
import type { FormSubmitData } from '../components/App';

const TODAY = new Date().toISOString().split('T')[0]!;

const statuses: CaseRecord['status'][] = ['Open', 'In Review', 'Resolved', 'Closed'];

/**
 * Pre-triage mock transactions into case records for the All Cases view.
 */
export function generateMockCases(): CaseRecord[] {
  return mockTransactions.map((txn, i) => {
    const formData: FormSubmitData = {
      customerName: txn.customerName,
      transactionId: txn.transactionId,
      paymentType: txn.paymentType,
      issueCategory: txn.issueCategory,
      transactionStatus: txn.transactionStatus,
      amount: txn.amount,
      disputeDate: txn.disputeDate,
    };

    const result = triage(formData, TODAY);

    return {
      id: `CASE-${String(i + 1).padStart(3, '0')}`,
      formData,
      result,
      status: statuses[i % statuses.length]!,
      createdAt: new Date(Date.now() - (i * 3600000)).toISOString(),
    };
  });
}
