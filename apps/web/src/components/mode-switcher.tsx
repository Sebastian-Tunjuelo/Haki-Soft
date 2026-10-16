'use client';

import React, { useState, useEffect } from 'react';
import { UserActiveModeEnum } from '@taskstream/shared-schemas';
import { ShoppingBag, Briefcase, CheckCircle2, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

interface ModeSwitcherProps {
  initialMode?: 'BUYER' | 'SELLER';
  isClerkAuthenticated: boolean;
}

export function ModeSwitcher({ initialMode = 'BUYER', isClerkAuthenticated }: ModeSwitcherProps) {
  const [activeMode, setActiveMode] = useState<'BUYER' | 'SELLER'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/v1/me/mode')
      .then((res) => res.json())
      .then((data) => {
        if (data?.activeMode) {
          setActiveMode(data.activeMode);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchMode = async (targetMode: 'BUYER' | 'SELLER') => {
    if (targetMode === activeMode) return;

    setIsLoading(true);
    setNotification(null);

    try {
      // Validar con ActiveModeSwitchSchema de shared-schemas
      const parsed = UserActiveModeEnum.safeParse(targetMode);
      if (!parsed.success) {
        throw new Error('Modo no válido');
      }

      const res = await fetch('/api/v1/me/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMode: targetMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al cambiar de modo');
      }

      setActiveMode(data.activeMode);
      setNotification({
        message: `Modo cambiado exitosamente a ${targetMode === 'BUYER' ? 'Buyer (Contratante)' : 'Seller (Freelancer)'}.`,
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
      {notification && (
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
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Grid de Modos (FE-2 Interactive Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {/* Buyer Mode Card */}
        <div
          onClick={() => !isLoading && handleSwitchMode('BUYER')}
          style={{
            background: activeMode === 'BUYER' ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface)',
            border: `2px solid ${activeMode === 'BUYER' ? 'var(--brand-buyer)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            cursor: isLoading ? 'wait' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            boxShadow: activeMode === 'BUYER' ? '0 0 24px -4px rgba(99, 102, 241, 0.25)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc',
              }}
            >
              <ShoppingBag size={22} />
            </div>
            {activeMode === 'BUYER' && (
              <span className="badge badge-buyer">
                <span className="pulse-dot" /> Modo Activo
              </span>
            )}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
            Buyer Mode
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            Actúa como contratante en América. Publica encargos con presupuesto tope, deposita fondos en el escrow de Open Payments y evalúa entregas con asistencia de IA para imagen y texto.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#818cf8' }} /> Publicar convocatorias con plazo inicial de 7d
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#818cf8' }} /> Fondeo único 100% en escrow protegido
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#818cf8' }} /> Ventana de 32h para revisar o solicitar corrección
            </li>
          </ul>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              disabled={isLoading || activeMode === 'BUYER'}
              className="btn btn-sm"
              style={{
                width: '100%',
                background: activeMode === 'BUYER' ? 'var(--brand-buyer)' : 'var(--surface-hover)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {activeMode === 'BUYER' ? 'Modo Seleccionado' : 'Activar Buyer Mode'}
            </button>
          </div>
        </div>

        {/* Seller Mode Card */}
        <div
          onClick={() => !isLoading && handleSwitchMode('SELLER')}
          style={{
            background: activeMode === 'SELLER' ? 'rgba(14, 165, 233, 0.08)' : 'var(--surface)',
            border: `2px solid ${activeMode === 'SELLER' ? 'var(--brand-seller)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            cursor: isLoading ? 'wait' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            boxShadow: activeMode === 'SELLER' ? '0 0 24px -4px rgba(14, 165, 233, 0.25)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7dd3fc',
              }}
            >
              <Briefcase size={22} />
            </div>
            {activeMode === 'SELLER' && (
              <span className="badge badge-seller">
                <span className="pulse-dot" /> Modo Activo
              </span>
            )}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
            Seller Mode
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            Ofrece tus servicios profesionales como freelancer. Explora oportunidades, envía propuestas competitivas (≤ presupuesto inicial) y cobra el 96% garantizado directo a tu billetera verificada.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#38bdf8' }} /> Publicar Gigs a precio fijo o negociar encargos
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#38bdf8' }} /> Cobro de 96% en USD, COP, CAD o moneda local
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#38bdf8' }} /> Solicitud única de extensión (+7d) al vencer
            </li>
          </ul>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              disabled={isLoading || activeMode === 'SELLER'}
              className="btn btn-sm"
              style={{
                width: '100%',
                background: activeMode === 'SELLER' ? 'var(--brand-seller)' : 'var(--surface-hover)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {activeMode === 'SELLER' ? 'Modo Seleccionado' : 'Activar Seller Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Caja de Invariantes del Dominio (SPEC-02 §2) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-subtle)',
          borderColor: 'var(--border)',
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <Sparkles size={20} style={{ color: 'var(--brand-blue)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Invariante de Identidad Unificada (SPEC-02 §2)
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Una misma cuenta Clerk mantiene un solo usuario unificado en PostgreSQL. Alternar entre Buyer y Seller no altera ni transfiere la titularidad de órdenes que ya se encuentren en ejecución o con fondos depositados en el escrow.
          </p>
        </div>
      </div>
    </div>
  );
}
