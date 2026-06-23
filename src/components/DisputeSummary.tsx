import type { TriageResult } from '../engine/types';
import type { FormSubmitData } from './App';

const actionColors: Record<string, string> = {
  'Resolve Immediately': 'bg-green-100 text-green-800 border-green-200',
  'Investigate Further': 'bg-amber-100 text-amber-800 border-amber-200',
  'Escalate': 'bg-red-100 text-red-800 border-red-200',
  'Refer to Another Team': 'bg-sb-blue-light text-sb-blue border-blue-200',
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-sb-gray-100 text-sb-gray-700',
};

const ageBandColors: Record<string, string> = {
  Recent: 'bg-green-100 text-green-800',
  Moderate: 'bg-amber-100 text-amber-800',
  Aged: 'bg-red-100 text-red-800',
};

interface Props {
  result: TriageResult;
  formData: FormSubmitData;
}

export default function DisputeSummary({ result, formData }: Props) {
  return (
    <div className="rounded-lg border border-sb-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Action banner */}
      <div className={`px-6 py-4 border-b ${actionColors[result.action]}`}>
        <p className="text-lg font-bold">{result.action}</p>
      </div>

      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-sb-blue">Triage Result</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[result.priority]}`}>
            Priority: {result.priority}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${ageBandColors[result.ageBand]}`}>
            Age: {result.ageBand} ({result.ageDays}d)
          </span>
        </div>

        {/* Reason */}
        <p className="text-sm text-sb-gray-700">{result.reason}</p>

        {/* Full dispute summary (TC-040) */}
        <div className="border-t border-sb-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-sb-gray-500 mb-3">Dispute Summary</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-sb-gray-500">Customer Name</dt>
            <dd className="text-sb-gray-900 font-medium">{formData.customerName}</dd>
            <dt className="text-sb-gray-500">Transaction Reference</dt>
            <dd className="text-sb-gray-900 font-medium">{formData.transactionId}</dd>
            <dt className="text-sb-gray-500">Amount</dt>
            <dd className="text-sb-gray-900 font-medium">R{formData.amount.toLocaleString()}</dd>
            <dt className="text-sb-gray-500">Payment Type</dt>
            <dd className="text-sb-gray-900">{formData.paymentType}</dd>
            <dt className="text-sb-gray-500">Issue Category</dt>
            <dd className="text-sb-gray-900">{formData.issueCategory}</dd>
            <dt className="text-sb-gray-500">Transaction Status</dt>
            <dd className="text-sb-gray-900">{formData.transactionStatus}</dd>
            <dt className="text-sb-gray-500">Age Band</dt>
            <dd className="text-sb-gray-900">{result.ageBand}</dd>
            <dt className="text-sb-gray-500">Priority</dt>
            <dd className="text-sb-gray-900">{result.priority}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
