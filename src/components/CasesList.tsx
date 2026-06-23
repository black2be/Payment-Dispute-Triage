import type { TriageResult } from '../engine/types';
import type { FormSubmitData } from './App';

export interface CaseRecord {
  id: string;
  formData: FormSubmitData;
  result: TriageResult;
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-800',
  'In Review': 'bg-amber-100 text-amber-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-sb-gray-100 text-sb-gray-700',
};

const actionColors: Record<string, string> = {
  'Resolve Immediately': 'bg-green-100 text-green-800',
  'Investigate Further': 'bg-amber-100 text-amber-800',
  'Escalate': 'bg-red-100 text-red-800',
  'Refer to Another Team': 'bg-sb-blue-light text-sb-blue',
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-sb-gray-100 text-sb-gray-700',
};

interface Props {
  cases: CaseRecord[];
  onUpdateStatus: (id: string, status: CaseRecord['status']) => void;
}

export default function CasesList({ cases, onUpdateStatus }: Props) {
  if (cases.length === 0) {
    return (
      <div className="rounded-lg border border-sb-gray-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sb-gray-500">No disputes captured yet. Create your first one.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sb-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sb-blue text-white text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sb-gray-200">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-sb-gray-50">
                <td className="px-4 py-3 text-sb-gray-900">{c.formData.customerName}</td>
                <td className="px-4 py-3 font-mono text-xs text-sb-gray-700">{c.formData.transactionId}</td>
                <td className="px-4 py-3 text-sb-gray-900">R{c.formData.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sb-gray-700">{c.formData.issueCategory}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[c.result.priority]}`}>
                    {c.result.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[c.result.action]}`}>
                    {c.result.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={c.status}
                    onChange={(e) => onUpdateStatus(c.id, e.target.value as CaseRecord['status'])}
                    className="rounded border-sb-gray-200 bg-sb-gray-50 px-2 py-1 text-xs focus:border-sb-blue focus:ring-sb-blue"
                  >
                    <option value="Open">Open</option>
                    <option value="In Review">In Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
