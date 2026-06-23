import { useState } from 'react';
import type { DisputeInput, TriageResult } from '../engine/types';
import { validate } from '../engine/validation';
import { triage } from '../engine/triage';
import { mockTransactions, lookupTransaction } from '../data/mockTransactions';
import DisputeForm from './DisputeForm';
import DisputeSummary from './DisputeSummary';
import RecommendationPanel from './RecommendationPanel';

export interface FormSubmitData extends DisputeInput {
  customerName: string;
}

export default function App() {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [formData, setFormData] = useState<FormSubmitData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<DisputeInput | null>(null);
  const [resetKey, setResetKey] = useState(0);

  function handleSubmit(input: FormSubmitData) {
    const validationErrors = validate(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      setResult(null);
      setFormData(null);
      return;
    }
    setErrors([]);
    const today = new Date().toISOString().split('T')[0]!;
    setResult(triage(input, today));
    setFormData(input);
  }

  function handleSelectTransaction(e: React.ChangeEvent<HTMLSelectElement>) {
    const txn = lookupTransaction(e.target.value);
    if (txn) {
      setPrefill({
        transactionId: txn.transactionId,
        paymentType: txn.paymentType,
        issueCategory: txn.issueCategory,
        transactionStatus: txn.transactionStatus,
        amount: txn.amount,
        disputeDate: txn.disputeDate,
      });
      setResult(null);
      setFormData(null);
      setErrors([]);
    }
  }

  function handleReset() {
    setResult(null);
    setFormData(null);
    setErrors([]);
    setPrefill(null);
    setResetKey((k) => k + 1);
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
        <div className="rounded bg-white p-4 shadow">
          <label htmlFor="txn-select" className="block text-sm font-medium text-gray-700 mb-1">
            Load from mock data
          </label>
          <select
            id="txn-select"
            onChange={handleSelectTransaction}
            className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            defaultValue=""
          >
            <option value="">Select a mock transaction…</option>
            {mockTransactions.map((t) => (
              <option key={t.transactionId} value={t.transactionId}>
                {t.transactionId} — {t.description}
              </option>
            ))}
          </select>
        </div>

        {errors.length > 0 && (
          <div role="alert" className="rounded bg-red-50 p-4 text-red-800">
            <ul className="list-disc pl-4">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <DisputeForm key={resetKey} onSubmit={handleSubmit} prefill={prefill} fieldErrors={errors} />

        {/* Result panel with aria-live for screen readers */}
        <div aria-live="polite" aria-atomic="true">
          {result && formData ? (
            <>
              <DisputeSummary result={result} formData={formData} />
              <div className="mt-6">
                <RecommendationPanel result={result} />
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  New dispute
                </button>
              </div>
            </>
          ) : (
            <div className="rounded bg-white p-6 shadow text-center text-gray-500">
              Capture a dispute to see the recommended next step.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
