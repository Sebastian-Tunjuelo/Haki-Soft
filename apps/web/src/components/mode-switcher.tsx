'use client';

import React, { useState } from 'react';
import { ActiveModeSwitchSchema } from '@taskstream/shared-schemas';
import { readActiveMode, readApiCode, type ActiveMode } from '@/src/lib/identity-contract';
import { ShoppingBag, Briefcase, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface ModeSwitcherProps {
  initialMode?: ActiveMode;
  serverCode?: string | null;
}

export function ModeSwitcher({ initialMode = 'BUYER', serverCode = null }: ModeSwitcherProps) {
  const [activeMode, setActiveMode] = useState<ActiveMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(
    serverCode ? { message: serverCode, type: 'error' } : null,
  );

  const handleSwitchMode = async (targetMode: ActiveMode) => {
    if (targetMode === activeMode) return;

    setIsLoading(true);
    setNotification(null);

    try {
      const parsed = ActiveModeSwitchSchema.safeParse({ activeMode: targetMode });
      if (!parsed.success) {
        throw new Error('ACTIVE_MODE_INVALID');
      }

      const res = await fetch('/api/v1/me/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        throw new Error(readApiCode(data) ?? 'USER_NOT_SYNCED');
      }

      const nextMode = readActiveMode(data);
      if (!nextMode) {
        throw new Error('ACTIVE_MODE_INVALID');
      }

      setActiveMode(nextMode);
      setNotification({
        message: `Modo cambiado a ${targetMode === 'BUYER' ? 'Buyer (contratante)' : 'Seller (quien entrega)'}`,
        type: 'success',
      });
    } catch (err) {
      setNotification({
        message: (err as Error).message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {notification ? (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: notification.type === 'success' ? 'var(--status-verified-bg)' : 'var(--status-failed-bg)',
            color: notification.type === 'success' ? 'var(--status-verified)' : 'var(--status-failed)',
            border: `1px solid ${
              notification.type === 'success' ? 'rgba(46, 196, 182, 0.35)' : 'rgba(255, 143, 128, 0.35)'
            }`,
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{notification.message}</span>
        </div>
      ) : null}

      <div className="ts-mode-grid">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isLoading && void handleSwitchMode('BUYER')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isLoading) void handleSwitchMode('BUYER');
            }
          }}
          className={`ts-mode-card ts-mode-card--buyer${activeMode === 'BUYER' ? ' is-active' : ''}`}
          style={{ cursor: isLoading ? 'wait' : 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="ts-mode-card__icon ts-mode-card__icon--buyer">
              <ShoppingBag size={22} />
            </div>
            {activeMode === 'BUYER' ? (
              <span className="badge badge-buyer">
                <span className="pulse-dot" /> Activo
              </span>
            ) : null}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Buyer
          </h3>
          <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.6, marginBottom: 16 }}>
            Publica encargos, deposita en escrow y revisa entregas con asistencia de IA.
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--volt)' }} /> Plazo inicial 7 días
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--volt)' }} /> Fondeo 100% en custodia
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--volt)' }} /> Ventana de 72h (3 días) para revisar o solicitar corrección
            </li>
          </ul>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              disabled={isLoading || activeMode === 'BUYER'}
              className={`btn btn-sm ${activeMode === 'BUYER' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: '100%' }}
            >
              {activeMode === 'BUYER' ? 'Modo seleccionado' : 'Activar Buyer'}
            </button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => !isLoading && void handleSwitchMode('SELLER')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isLoading) void handleSwitchMode('SELLER');
            }
          }}
          className={`ts-mode-card ts-mode-card--seller${activeMode === 'SELLER' ? ' is-active' : ''}`}
          style={{ cursor: isLoading ? 'wait' : 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="ts-mode-card__icon ts-mode-card__icon--seller">
              <Briefcase size={22} />
            </div>
            {activeMode === 'SELLER' ? (
              <span className="badge badge-seller">
                <span className="pulse-dot" /> Activo
              </span>
            ) : null}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            Seller
          </h3>
          <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.6, marginBottom: 16 }}>
            Entrega el trabajo y cobra el 96% directo a tu billetera verificada.
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--tide)' }} /> Gigs o propuestas ≤ presupuesto
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--tide)' }} /> Cobro 96% multimoneda
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--tide)' }} /> Extensión única (+7d) al vencer
            </li>
          </ul>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              disabled={isLoading || activeMode === 'SELLER'}
              className={`btn btn-sm ${activeMode === 'SELLER' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ width: '100%' }}
            >
              {activeMode === 'SELLER' ? 'Modo seleccionado' : 'Activar Seller'}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Sparkles size={20} style={{ color: 'var(--volt)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
            Una cuenta, dos modos
          </h4>
          <p style={{ fontSize: 13, color: 'var(--mist)', lineHeight: 1.5, margin: 0 }}>
            Alternar Buyer/Seller no cambia la titularidad de órdenes con fondos ya en escrow.
          </p>
        </div>
      </div>
    </div>
  );
}
