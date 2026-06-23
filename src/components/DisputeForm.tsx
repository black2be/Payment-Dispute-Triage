import { useState } from 'react';
import type { DisputeInput, PaymentType, IssueCategory, TransactionStatus } from '../engine/types';

const paymentTypes: PaymentType[] = ['Card Payment', 'EFT', 'Internal Transfer'];
const issueCategories: IssueCategory[] = [
  'Duplicate Debit',
  'Failed Transfer',
  'Missing Payment',
  'Unauthorized Transaction',
];
const statuses: TransactionStatus[] = ['Completed', 'Pending', 'Failed', 'Reversed'];

interface Props {
  onSubmit: (input: DisputeInput) => void;
}

export default function DisputeForm({ onSubmit }: Props) {
  const [form, setForm] = useState({
    transactionId: '',
    paymentType: '' as PaymentType | '',
    issueCategory: '' as IssueCategory | '',
    transactionStatus: '' as TransactionStatus | '',
    amount: '',
    disputeDate: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      transactionId: form.transactionId,
      paymentType: form.paymentType as PaymentType,
      issueCategory: form.issueCategory as IssueCategory,
      transactionStatus: form.transactionStatus as TransactionStatus,
      amount: Number(form.amount),
      disputeDate: form.disputeDate,
    });
  }

  const labelClass = 'block text-sm font-medium text-gray-700';
  const inputClass = 'mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">Dispute Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transactionId" className={labelClass}>Transaction ID</label>
          <input id="transactionId" name="transactionId" value={form.transactionId} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="paymentType" className={labelClass}>Payment Type</label>
          <select id="paymentType" name="paymentType" value={form.paymentType} onChange={handleChange} className={inputClass}>
            <option value="">Select…</option>
            {paymentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="issueCategory" className={labelClass}>Issue Category</label>
          <select id="issueCategory" name="issueCategory" value={form.issueCategory} onChange={handleChange} className={inputClass}>
            <option value="">Select…</option>
            {issueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="transactionStatus" className={labelClass}>Transaction Status</label>
          <select id="transactionStatus" name="transactionStatus" value={form.transactionStatus} onChange={handleChange} className={inputClass}>
            <option value="">Select…</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className={labelClass}>Amount (R)</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="disputeDate" className={labelClass}>Dispute Date</label>
          <input id="disputeDate" name="disputeDate" type="date" value={form.disputeDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <button type="submit" className="mt-6 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Triage Dispute
      </button>
    </form>
  );
}
