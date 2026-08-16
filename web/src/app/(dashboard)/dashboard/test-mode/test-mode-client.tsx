'use client';

import { useMemo, useState, useTransition } from 'react';
import type { LinhTrainingScenario } from '@/lib/training/types';
import { runTestModeScenarioAction } from './actions';

type RunResult = Awaited<ReturnType<typeof runTestModeScenarioAction>>;

export default function TestModeClient({ scenarios }: { scenarios: LinhTrainingScenario[] }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '');
  const [result, setResult] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [pending, startTransition] = useTransition();
  const scenario = useMemo(() => scenarios.find((item) => item.id === scenarioId), [scenarioId, scenarios]);

  function run(confirmed: boolean) {
    startTransition(async () => {
      const next = await runTestModeScenarioAction(scenarioId, confirmed);
      setResult(next);
      setHistory((current) => [next, ...current].slice(0, 12));
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-800">Synthetic Test Mode</div>
        <h2 className="mt-1 text-xl font-semibold text-gray-900">Linh Falls Church Pilot</h2>
        <p className="mt-2 text-sm text-gray-700">No real calls, SMS, orders, bookings, provider writes, or customer data can be used by this flow. All action adapters are mocked.</p>
      </section>

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <label className="text-sm font-medium text-gray-900" htmlFor="scenario">Scenario</label>
          <select id="scenario" value={scenarioId} onChange={(event) => { setScenarioId(event.target.value); setResult(null); }} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {scenarios.map((item) => <option key={item.id} value={item.id}>{item.language.toUpperCase()} · {item.id}</option>)}
          </select>
          {scenario && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{scenario.callerText}</p>}
        </div>
        <div className="flex items-end gap-2">
          <button disabled={pending || !scenarioId} onClick={() => run(false)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Run observation</button>
        </div>
      </section>

      {result && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500">Linh observation</div>
              <p className="mt-1 text-sm text-gray-800">{result.observation.rawResponse}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.score.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{result.score.passed ? 'SCORER PASS' : 'SCORER FAIL'} · {result.score.score}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Info label="Source" value={result.audit.source} />
            <Info label="Verification" value={result.audit.verificationState} />
            <Info label="Result" value={result.audit.result} />
            <Info label="Human escalation" value={result.audit.humanEscalationRequired ? 'required' : 'not required'} />
          </div>

          {result.audit.failureReason && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800"><strong>Failure reason:</strong> {result.audit.failureReason}</div>}

          {result.confirmationRequired && result.proposedAction && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-semibold text-blue-900">Exact action confirmation required</div>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-blue-900">{JSON.stringify(result.proposedAction, null, 2)}</pre>
              <button disabled={pending} onClick={() => run(true)} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm this exact synthetic action</button>
            </div>
          )}

          {result.toolResult && (
            <div className={`rounded-lg p-4 text-sm ${result.toolResult.ok ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
              <strong>Simulated tool execution:</strong> {result.toolResult.ok ? `PASS · ${result.toolResult.type} · simulated=${String(result.toolResult.simulated)}` : `${result.toolResult.code} · ${result.toolResult.message}`}
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold text-gray-900">Test Mode audit trail</h3>
        <div className="mt-3 space-y-2">
          {history.length === 0 && <p className="text-sm text-gray-500">No synthetic runs yet.</p>}
          {history.map((item) => (
            <div key={item.audit.id} className="grid gap-2 rounded-lg border border-gray-100 p-3 text-xs md:grid-cols-5">
              <span className="font-medium text-gray-900">{item.audit.scenarioId}</span>
              <span>{item.audit.verificationState}</span>
              <span>{item.audit.action ?? 'no action'}</span>
              <span>{item.audit.result}</span>
              <span>{item.audit.humanEscalationRequired ? 'escalate' : 'no escalation'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-50 p-3"><div className="text-[11px] font-semibold uppercase text-gray-500">{label}</div><div className="mt-1 break-words text-sm font-medium text-gray-900">{value}</div></div>;
}
