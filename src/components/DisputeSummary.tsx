import type { TriageResult } from '../engine/types';
import type { FormSubmitData } from './App';

const actionColors: Record<string, string> = {
  'Resolve Immediately': 'bg-green-100 text-green-800',
  'Investigate Further': 'bg-yellow-100 text-yellow-800',
  'Escalate': 'bg-red-100 text-red-800',
  'Refer to Another Team': 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

interface Props {
  result: TriageResult;
  formData: FormSubmitData;
}

export default function DisputeSummary({ result, formData }: Props) {
  return (
    <div className="rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">Triage Result</h2>

      {/* Action + Priority + Age badges */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${actionColors[result.action]}`}>
          {result.action}
        </span>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${priorityColors[result.priority]}`}>
          Priority: {result.priority}
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          Age: {result.ageBand} ({result.ageDays}d)
        </span>
      </div>

      {/* Plain-language reasoning */}
      <p className="mb-4 text-gray-700">{result.reason}</p>

      {/* Full dispute summary (TC-040) */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Dispute Summary</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Customer Name</dt>
          <dd className="text-gray-900">{formData.customerName}</dd>
          <dt className="text-gray-500">Transaction Reference</dt>
          <dd className="text-gray-900">{formData.transactionId}</dd>
          <dt className="text-gray-500">Amount</dt>
          <dd className="text-gray-900">R{formData.amount.toLocaleString()}</dd>
          <dt className="text-gray-500">Payment Type</dt>
          <dd className="text-gray-900">{formData.paymentType}</dd>
          <dt className="text-gray-500">Issue Category</dt>
          <dd className="text-gray-900">{formData.issueCategory}</dd>
          <dt className="text-gray-500">Transaction Status</dt>
          <dd className="text-gray-900">{formData.transactionStatus}</dd>
          <dt className="text-gray-500">Age Band</dt>
          <dd className="text-gray-900">{result.ageBand}</dd>
          <dt className="text-gray-500">Priority</dt>
          <dd className="text-gray-900">{result.priority}</dd>
        </dl>
      </div>
    </div>
  );
}
