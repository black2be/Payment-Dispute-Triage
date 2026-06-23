import { useState, useEffect, useCallback } from 'react';
import type { DisputeInput, PaymentType, IssueCategory, TransactionStatus } from '../engine/types';
import { lookupTransaction } from '../data/mockTransactions';
import type { FormSubmitData } from './App';

const paymentTypes: PaymentType[] = ['Card Payment', 'EFT', 'Internal Transfer'];
const issueCategories: IssueCategory[] = [
  'Duplicate Debit',
  'Failed Transfer',
  'Missing Payment',
  'Unauthorized Transaction',
];
const statuses: TransactionStatus[] = ['Completed', 'Pending', 'Failed', 'Reversed'];

// Code → label map for transaction status (design §2.1)
const statusCodeToLabel: Record<string, TransactionStatus> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
};

interface Props {
  onSubmit: (input: FormSubmitData) => void;
  prefill?: DisputeInput | null;
  fieldErrors?: string[];
  isEditing?: boolean;
}

export default function DisputeForm({ onSubmit, prefill, fieldErrors = [], isEditing = false }: Props) {
  const [form, setForm] = useState({
    transactionId: '',
    customerName: '',
    paymentType: '' as PaymentType | '',
    issueCategory: '' as IssueCategory | '',
    transactionStatus: '' as TransactionStatus | '',
    amount: '',
    disputeDate: '',
    description: '',
  });
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not-found'>('idle');
  const [statusFromLookup, setStatusFromLookup] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm({
        transactionId: prefill.transactionId,
        customerName: 'customerName' in prefill ? (prefill as FormSubmitData).customerName : '',
        paymentType: prefill.paymentType,
        issueCategory: prefill.issueCategory,
        transactionStatus: prefill.transactionStatus,
        amount: String(prefill.amount),
        disputeDate: prefill.disputeDate,
        description: '',
      });
      setLookupStatus('idle');
      setStatusFromLookup(false);
    }
  }, [prefill]);

  // REQ-06.1/06.2: Look up transaction reference on blur
  const handleReferenceLookup = useCallback(async () => {
    const ref = form.transactionId.trim();
    if (!ref) return;

    // Try API first
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(ref)}`);
      if (res.ok) {
        const txn = await res.json();
        const label = statusCodeToLabel[txn.status] || '';
        setForm((prev) => ({
          ...prev,
          transactionStatus: label as TransactionStatus,
          amount: txn.amount ? String(txn.amount) : prev.amount,
          disputeDate: txn.transactionDate
            ? new Date(txn.transactionDate).toISOString().split('T')[0]!
            : prev.disputeDate,
        }));
        setLookupStatus('found');
        setStatusFromLookup(true);
        return;
      }
    } catch {
      // API not available — fall through to local lookup
    }

    // Fallback: check local mock dataset
    const localTxn = lookupTransaction(ref);
    if (localTxn) {
      setForm((prev) => ({
        ...prev,
        transactionStatus: localTxn.transactionStatus,
        amount: String(localTxn.amount),
        disputeDate: localTxn.disputeDate,
        paymentType: localTxn.paymentType,
      }));
      setLookupStatus('found');
      setStatusFromLookup(true);
    } else {
      setLookupStatus('not-found');
      setStatusFromLookup(false);
    }
  }, [form.transactionId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Reset lookup state if reference changes
    if (name === 'transactionId') {
      setLookupStatus('idle');
      setStatusFromLookup(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      customerName: form.customerName,
      transactionId: form.transactionId,
      paymentType: form.paymentType as PaymentType,
      issueCategory: form.issueCategory as IssueCategory,
      transactionStatus: form.transactionStatus as TransactionStatus,
      amount: Number(form.amount),
      disputeDate: form.disputeDate,
    });
  }

  const labelClass = 'block text-sm font-medium text-sb-gray-700';
  const inputClass = 'mt-1 block w-full rounded-md border-sb-gray-200 bg-sb-gray-50 px-3 py-2 text-sm shadow-sm focus:border-sb-blue focus:ring-sb-blue';
  const errorInputClass = 'mt-1 block w-full rounded-md border-red-400 bg-red-50 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-red-500';

  function hasError(field: string) {
    return fieldErrors.some((e) => e.toLowerCase().includes(field.toLowerCase()));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-sb-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-sb-blue">Capture dispute</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customerName" className={labelClass}>Customer Name</label>
          <input
            id="customerName"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            className={hasError('customer') ? errorInputClass : inputClass}
            placeholder="e.g. Customer Alpha"
            aria-invalid={hasError('customer')}
            aria-describedby={hasError('customer') ? 'customerName-error' : undefined}
          />
          {hasError('customer') && <p id="customerName-error" className="mt-1 text-xs text-red-600">Customer name is required.</p>}
        </div>
        <div>
          <label htmlFor="transactionId" className={labelClass}>Transaction Reference</label>
          <input
            id="transactionId"
            name="transactionId"
            value={form.transactionId}
            onChange={handleChange}
            onBlur={handleReferenceLookup}
            className={hasError('transaction id') ? errorInputClass : inputClass}
            placeholder="e.g. TXN-001"
            aria-invalid={hasError('transaction id')}
            aria-describedby={hasError('transaction id') ? 'transactionId-error' : undefined}
          />
          {hasError('transaction id') && <p id="transactionId-error" className="mt-1 text-xs text-red-600">Transaction ID is required.</p>}
          {lookupStatus === 'found' && (
            <p className="mt-1 text-xs text-green-600">Transaction found — status pre-populated.</p>
          )}
          {lookupStatus === 'not-found' && (
            <p className="mt-1 text-xs text-amber-600">Reference not found — enter status manually.</p>
          )}
        </div>
        <div>
          <label htmlFor="paymentType" className={labelClass}>Payment Type</label>
          <select id="paymentType" name="paymentType" value={form.paymentType} onChange={handleChange} className={hasError('payment type') ? errorInputClass : inputClass} aria-invalid={hasError('payment type')}>
            <option value="">Select…</option>
            {paymentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="issueCategory" className={labelClass}>Issue Category</label>
          <select id="issueCategory" name="issueCategory" value={form.issueCategory} onChange={handleChange} className={hasError('issue category') ? errorInputClass : inputClass} aria-invalid={hasError('issue category')}>
            <option value="">Select…</option>
            {issueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="transactionStatus" className={labelClass}>
            Transaction Status
            {statusFromLookup && <span className="ml-2 text-xs text-green-600">(from lookup)</span>}
          </label>
          <select id="transactionStatus" name="transactionStatus" value={form.transactionStatus} onChange={handleChange} className={hasError('transaction status') ? errorInputClass : inputClass} aria-invalid={hasError('transaction status')}>
            <option value="">Select…</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className={labelClass}>Amount (R)</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} className={hasError('amount') ? errorInputClass : inputClass} aria-invalid={hasError('amount')} />
        </div>
        <div>
          <label htmlFor="disputeDate" className={labelClass}>Transaction Date</label>
          <input id="disputeDate" name="disputeDate" type="date" value={form.disputeDate} onChange={handleChange} className={hasError('date') ? errorInputClass : inputClass} aria-invalid={hasError('date')} />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>Description (optional)</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} className={inputClass} rows={2} placeholder="Additional details…" />
        </div>
      </div>
      <button type="submit" className="mt-6 rounded-md bg-sb-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sb-blue-dark focus:outline-none focus:ring-2 focus:ring-sb-blue focus:ring-offset-2">
        {isEditing ? 'Save Changes' : 'Triage Dispute'}
      </button>
    </form>
  );
}
