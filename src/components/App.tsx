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
    <div className="min-h-screen bg-sb-gray-50 font-sans">
      {/* Header bar */}
      <header className="bg-sb-blue shadow-md">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/sb-logo.jpeg" alt="Standard Bank" className="h-10 w-10 rounded-sm object-contain" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Payment Dispute Triage</h1>
              <p className="text-xs text-blue-200">Digital Platforms — Operations Tool</p>
            </div>
          </div>
          <span className="text-xs text-blue-200">Prototype v1.0</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Mock data selector */}
        <div className="rounded-lg border border-sb-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="txn-select" className="block text-sm font-medium text-sb-gray-700 mb-1">
            Load from mock data
          </label>
          <select
            id="txn-select"
            onChange={handleSelectTransaction}
            className="block w-full rounded-md border-sb-gray-200 bg-sb-gray-50 px-3 py-2 text-sm shadow-sm focus:border-sb-blue focus:ring-sb-blue"
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

        {/* Validation errors */}
        {errors.length > 0 && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-medium text-sm mb-1">Please correct the following:</p>
            <ul className="list-disc pl-5 text-sm">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <DisputeForm key={resetKey} onSubmit={handleSubmit} prefill={prefill} fieldErrors={errors} />

        {/* Result panel */}
        <div aria-live="polite" aria-atomic="true">
          {result && formData ? (
            <>
              <DisputeSummary result={result} formData={formData} />
              <div className="mt-6">
                <RecommendationPanel result={result} />
              </div>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md border border-sb-gray-200 bg-white px-5 py-2 text-sm font-medium text-sb-gray-700 shadow-sm hover:bg-sb-gray-50 focus:outline-none focus:ring-2 focus:ring-sb-blue"
                >
                  New dispute
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-sb-gray-200 bg-white p-8 shadow-sm text-center">
              <p className="text-sb-gray-500">Capture a dispute to see the recommended next step.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-sb-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between text-xs text-sb-gray-500">
          <span>© 2026 Standard Bank Group. Internal use only.</span>
          <span>AI SDLC — Digital Platforms</span>
        </div>
      </footer>
    </div>
  );
}
