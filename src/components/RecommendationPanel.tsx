import type { TriageResult } from '../engine/types';

interface Props {
  result: TriageResult;
}

export default function RecommendationPanel({ result }: Props) {
  return (
    <div className="rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">Rule Evaluations</h2>
      <p className="mb-2 text-sm text-gray-500">
        Triggered: <strong>{result.triggeredRuleId}</strong>
      </p>
      <ul className="space-y-2">
        {result.ruleEvaluations.map((ev) => (
          <li
            key={ev.ruleId}
            className={`rounded border p-3 ${ev.matched ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{ev.ruleId}</span>
              <span className={`text-xs font-medium ${ev.matched ? 'text-green-700' : 'text-gray-400'}`}>
                {ev.matched ? 'MATCHED' : 'not matched'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{ev.label}</p>
            {ev.reason && <p className="mt-1 text-sm italic text-gray-700">{ev.reason}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
