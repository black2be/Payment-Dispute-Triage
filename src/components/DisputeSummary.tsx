import type { TriageResult } from '../engine/types';

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
}

export default function DisputeSummary({ result }: Props) {
  return (
    <div className="rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">Triage Result</h2>
      <div className="flex flex-wrap gap-3">
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
      <p className="mt-4 text-gray-700">{result.reason}</p>
    </div>
  );
}
