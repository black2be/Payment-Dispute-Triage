import type { TriageResult } from '../engine/types';

interface Props {
  result: TriageResult;
}

export default function RecommendationPanel({ result }: Props) {
  return (
    <div className="rounded-lg border border-sb-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-sb-blue">Rule Evaluations</h2>
      <p className="mb-3 text-sm text-sb-gray-500">
        Triggered: <strong className="text-sb-blue">{result.triggeredRuleId}</strong>
      </p>
      <ul className="space-y-2">
        {result.ruleEvaluations.map((ev) => (
          <li
            key={ev.ruleId}
            className={`rounded-md border p-3 ${
              ev.matched
                ? ev.ruleId === result.triggeredRuleId
                  ? 'border-sb-blue bg-sb-blue-light'
                  : 'border-green-200 bg-green-50'
                : 'border-sb-gray-200 bg-sb-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-sb-gray-700">{ev.ruleId}</span>
              <span className={`text-xs font-medium ${
                ev.matched
                  ? ev.ruleId === result.triggeredRuleId
                    ? 'text-sb-blue'
                    : 'text-green-700'
                  : 'text-sb-gray-500'
              }`}>
                {ev.ruleId === result.triggeredRuleId ? '✓ TRIGGERED' : ev.matched ? '✓ matched' : '– not matched'}
              </span>
            </div>
            <p className="text-sm text-sb-gray-700">{ev.label}</p>
            {ev.reason && <p className="mt-1 text-sm italic text-sb-gray-500">{ev.reason}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
