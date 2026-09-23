type ClassMetrics = {
  precision?: number;
  recall?: number;
  'f1-score'?: number;
  support?: number;
};

type MetricsPayload = {
  model?: string;
  data_source?: string;
  provenance?: string;
  feature_names?: string[];
  test?: {
    n_samples?: number;
    accuracy?: number;
    report?: Record<string, ClassMetrics | number>;
    confusion_matrix?: number[][];
    classes_order?: string[];
  };
};

function pct(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function reportClassNames(report: Record<string, ClassMetrics | number> | undefined): string[] {
  if (!report) return [];
  const skip = new Set(['accuracy', 'macro avg', 'weighted avg']);
  return Object.keys(report).filter((k) => !skip.has(k));
}

export function ModelMetricsDrawer({
  open,
  onClose,
  metrics,
  unavailable,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  metrics: MetricsPayload | Record<string, unknown> | null;
  unavailable?: boolean;
  loading?: boolean;
}) {
  if (!open) return null;

  const payload = metrics as MetricsPayload | null;
  const acc = payload?.test?.accuracy;
  const report = payload?.test?.report;
  const macro = report?.['macro avg'] as ClassMetrics | undefined;
  const matrix = payload?.test?.confusion_matrix;
  const classOrder =
    payload?.test?.classes_order?.length
      ? payload.test.classes_order
      : reportClassNames(report);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metrics-title"
    >
      <div className="w-full max-w-2xl bg-[#1E293B] border border-[#334155] rounded-lg flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center px-4 py-3 border-b border-[#334155] shrink-0">
          <h4 id="metrics-title" className="text-sm font-semibold tracking-wide">MODEL EVALUATION</h4>
          <button type="button" className="text-xs text-[#94A3B8] hover:text-white px-2 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-4 text-xs">
          {loading && (
            <p className="text-[#94A3B8]" aria-live="polite">Loading evaluation metrics…</p>
          )}

          {!loading && (unavailable || !metrics) && (
            <div className="space-y-2">
              <p className="text-[#F59E0B] font-semibold">EVALUATION DATA UNAVAILABLE</p>
              <p className="text-[#94A3B8]">
                Evaluation metrics are not available from the current backend.
              </p>
            </div>
          )}

          {!loading && metrics && !unavailable && (
            <>
              <div>
                <p className="text-[10px] font-semibold text-[#F59E0B] border border-[#F59E0B]/30 inline-block px-2 py-0.5 rounded">
                  SIMULATION DATA
                </p>
                <p className="text-[#CBD5E1] font-medium mt-2">Festival Surge Random Forest</p>
                <p className="text-[#94A3B8]">Held-out evaluation</p>
              </div>

              <div className="grid grid-cols-3 gap-2 border border-[#334155] rounded-lg overflow-hidden">
                <div className="p-3 bg-[#0F172A]/50 border-r border-[#334155]">
                  <p className="text-[10px] uppercase tracking-wide text-[#64748b]">Accuracy</p>
                  <p className="text-lg font-semibold text-[#F8FAFC] mt-1">{acc != null ? pct(acc) : '—'}</p>
                </div>
                <div className="p-3 bg-[#0F172A]/50 border-r border-[#334155]">
                  <p className="text-[10px] uppercase tracking-wide text-[#64748b]">Macro F1</p>
                  <p className="text-lg font-semibold text-[#F8FAFC] mt-1">
                    {macro?.['f1-score'] != null ? pct(macro['f1-score']) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-[#0F172A]/50">
                  <p className="text-[10px] uppercase tracking-wide text-[#64748b]">Test samples</p>
                  <p className="text-lg font-semibold text-[#F8FAFC] mt-1">
                    {payload?.test?.n_samples ?? '—'}
                  </p>
                </div>
              </div>

              {(payload?.model || payload?.provenance || payload?.test?.n_samples != null) && (
                <div className="text-[#94A3B8] space-y-1 border border-[#334155] rounded-lg p-3 bg-[#0F172A]/30">
                  {payload.model && (
                    <p>
                      <span className="text-[#64748b]">Model:</span> {payload.model}
                    </p>
                  )}
                  {payload.provenance && (
                    <p>
                      <span className="text-[#64748b]">Dataset:</span> {payload.provenance}
                    </p>
                  )}
                  {payload.test?.n_samples != null && (
                    <p>
                      <span className="text-[#64748b]">Test:</span> {payload.test.n_samples} samples
                    </p>
                  )}
                </div>
              )}

              {matrix && matrix.length > 0 && classOrder.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold mb-2">
                    Confusion matrix
                  </p>
                  <div className="overflow-x-auto border border-[#334155] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#0F172A]/60">
                          <th className="p-2 text-left text-[#64748b] font-semibold border-b border-[#334155]" />
                          <th
                            colSpan={classOrder.length}
                            className="p-2 text-center text-[#64748b] font-semibold border-b border-[#334155]"
                          >
                            Predicted
                          </th>
                        </tr>
                        <tr className="bg-[#0F172A]/40">
                          <th className="p-2 text-left text-[#64748b] border-b border-[#334155]">Actual</th>
                          {classOrder.map((cls) => (
                            <th
                              key={cls}
                              className="p-2 text-center text-[#94A3B8] font-medium border-b border-l border-[#334155]"
                            >
                              {cls}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.map((row, i) => (
                          <tr key={classOrder[i] ?? i}>
                            <td className="p-2 font-medium text-[#CBD5E1] border-b border-[#334155]">
                              {classOrder[i] ?? `Row ${i + 1}`}
                            </td>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="p-2 text-center font-mono text-[#E2E8F0] border-b border-l border-[#334155]"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-semibold mb-2">
                    Per-class performance
                  </p>
                  <div className="overflow-x-auto border border-[#334155] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#0F172A]/60">
                          <th className="p-2 text-left text-[#64748b] border-b border-[#334155]">Class</th>
                          <th className="p-2 text-right text-[#64748b] border-b border-l border-[#334155]">
                            Precision
                          </th>
                          <th className="p-2 text-right text-[#64748b] border-b border-l border-[#334155]">
                            Recall
                          </th>
                          <th className="p-2 text-right text-[#64748b] border-b border-l border-[#334155]">F1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(classOrder.length ? classOrder : reportClassNames(report)).map((cls) => {
                          const row = report[cls] as ClassMetrics | undefined;
                          if (!row || typeof row !== 'object') return null;
                          return (
                            <tr key={cls}>
                              <td className="p-2 font-medium text-[#CBD5E1] border-b border-[#334155]">{cls}</td>
                              <td className="p-2 text-right font-mono border-b border-l border-[#334155]">
                                {pct(row.precision)}
                              </td>
                              <td className="p-2 text-right font-mono border-b border-l border-[#334155]">
                                {pct(row.recall)}
                              </td>
                              <td className="p-2 text-right font-mono border-b border-l border-[#334155]">
                                {pct(row['f1-score'])}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t border-[#334155] pt-3 space-y-1 text-[#64748b] text-[11px]">
                <p className="font-semibold text-[#94A3B8] uppercase tracking-wide text-[10px]">Data provenance</p>
                <p className="text-[#F59E0B] font-semibold">SIMULATION DATA</p>
                <p>Model trained/evaluated on simulation-derived data.</p>
                <p>
                  Evaluation uses simulation-derived data and should not be interpreted as measured real-world
                  festival traffic performance.
                </p>
                <p>This evaluation does not represent measured real-world Chennai festival traffic performance.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
