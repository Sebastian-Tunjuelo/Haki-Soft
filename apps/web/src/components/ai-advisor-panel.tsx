'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { AiAdvisorReportSchema, type AiAdvisorReport } from '@taskstream/shared-schemas';
import { api, humanError } from '@/src/lib/api-client';

type LoadState = 'loading' | 'ready' | 'none' | 'error';

/**
 * SPEC-08 — Panel del informe consultivo (imagen/texto) o aviso “sin consejero”.
 */
export function AiAdvisorPanel({
  taskId,
  deliverableId,
}: {
  taskId: string;
  deliverableId: string;
}) {
  const [state, setState] = useState<LoadState>('loading');
  const [report, setReport] = useState<AiAdvisorReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setError(null);

    void api(`/api/v1/orders/${taskId}/deliverables/${deliverableId}/ai-report`)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 403) {
          setState('error');
          setError(humanError(res.status, res.body));
          return;
        }
        if (res.status !== 200) {
          setState('error');
          setError(humanError(res.status, res.body));
          return;
        }
        if (res.body === null || res.body === undefined) {
          setReport(null);
          setState('none');
          return;
        }
        const parsed = AiAdvisorReportSchema.safeParse(res.body);
        if (!parsed.success) {
          setState('error');
          setError('Respuesta de informe IA inválida.');
          return;
        }
        setReport(parsed.data);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setState('error');
          setError(humanError(0, { code: 'API_UNREACHABLE' }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, deliverableId]);

  if (state === 'loading') {
    return (
      <section style={panel}>
        <h2 style={title}>Consejero de IA</h2>
        <p style={muted}>Cargando informe…</p>
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section style={panel}>
        <h2 style={title}>Consejero de IA</h2>
        <p style={err}>{error}</p>
      </section>
    );
  }

  if (state === 'none' || !report) {
    return (
      <section style={panel}>
        <h2 style={title}>Consejero de IA</h2>
        <p style={muted}>
          Esta categoría no tiene consejero de IA en el MVP. Usa el preview protegido para revisar la
          entrega.
        </p>
      </section>
    );
  }

  return (
    <section style={panel}>
      <h2 style={title}>Consejero de IA · {report.auditableModality}</h2>
      <p style={{ margin: 0, fontSize: 14 }}>
        <strong>{report.advisoryLabel}</strong> · puntuación {report.advisoryScore}/100
      </p>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{report.executiveSummaryForBuyer}</p>

      {report.suggestionsForFreelancer.length > 0 ? (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>Sugerencias al Freelancer</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
            {report.suggestionsForFreelancer.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>Criterios</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
          {report.criteriaEvaluation.map((c) => (
            <li key={c.criterionId}>
              <strong>{c.criterionId}</strong> · {c.status}: {c.evidence}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
        {report.mandatoryDisclaimer}
      </p>
      {report.securityAndIntegrityAudit.promptInjectionDetected ? (
        <p style={warn}>Se detectó posible prompt injection en el artefacto (solo informativo).</p>
      ) : null}
    </section>
  );
}

const panel: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--surface)',
};

const title: CSSProperties = { margin: 0, fontSize: '1.05rem' };
const muted: CSSProperties = { margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 };
const err: CSSProperties = { margin: 0, fontSize: 14, color: 'var(--status-error, #f87171)' };
const warn: CSSProperties = { margin: 0, fontSize: 12, color: 'var(--status-pending)' };
