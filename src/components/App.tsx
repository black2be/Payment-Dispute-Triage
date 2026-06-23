import { useState } from 'react';
import type { DisputeInput, TriageResult } from '../engine/types';
import { validate } from '../engine/validation';
import { triage } from '../engine/triage';
import DisputeForm from './DisputeForm';
import DisputeSummary from './DisputeSummary';
import RecommendationPanel from './RecommendationPanel';

export default function App() {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(input: DisputeInput) {
    const validationErrors = validate(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      setResult(null);
      return;
    }
    setErrors([]);
    const today = new Date().toISOString().split('T')[0]!;
    setResult(triage(input, today));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Payment Dispute Triage
        </h1>
        <p className="text-gray-600">Capture a dispute and get a recommendation</p>
      </header>

      <main className="mx-auto max-w-4xl space-y-6">
        {errors.length > 0 && (
          <div role="alert" className="rounded bg-red-50 p-4 text-red-800">
            <ul className="list-disc pl-4">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <DisputeForm onSubmit={handleSubmit} />

        {result && (
          <>
            <DisputeSummary result={result} />
            <RecommendationPanel result={result} />
          </>
        )}
      </main>
    </div>
  );
}
