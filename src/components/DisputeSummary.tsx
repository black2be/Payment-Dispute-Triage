import type { TriageResult } from '../engine/types';
import type { FormSubmitData } from './App';

const actionColors: Record<string, string> = {
  'Resolve Immediately': 'bg-green-100 text-green-800 border-green-300',
  'Investigate Further': 'bg-amber-100 text-amber-800 border-amber-300',
  'Escalate': 'bg-red-100 text-red-800 border-red-300',
  'Refer to Another Team': 'bg-sb-blue-light text-sb-blue border-blue-300',
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
      <div className={`px-6 py-5 border-b ${actionColors[result.action]}`}>
        <p className="text-xl font-bold">Recommended Action: {result.action}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[result.priority]}`}>
            Priority: {result.priority}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${ageBandColors[result.ageBand]}`}>
            Age: {result.ageBand} ({result.ageDays} days)
          </span>
        </div>

        {/* Reason — the "why" */}
        <div className="rounded-md bg-sb-gray-50 border border-sb-gray-200 p-4">
          <p className="text-sm font-medium text-sb-gray-500 mb-1">Why this recommendation?</p>
          <p className="text-base text-sb-gray-900">{result.reason}</p>
        </div>

        {/* Case summary */}
        <div className="border-t border-sb-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-sb-blue mb-3">Case Summary</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-sb-gray-500">Customer</dt>
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
            <dt className="text-sb-gray-500">Dispute Age</dt>
            <dd className="text-sb-gray-900">{result.ageBand} ({result.ageDays} days)</dd>
            <dt className="text-sb-gray-500">Priority Level</dt>
            <dd className="text-sb-gray-900">{result.priority}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
