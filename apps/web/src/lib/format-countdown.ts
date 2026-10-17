/**
 * Cuenta regresiva legible: prioriza días + horas (p. ej. «6 días 23 h»)
 * en lugar de volcar todo en horas («167 h»).
 */
export function formatCountdown(deadlineIso: string | null | undefined, nowMs: number): string {
  if (!deadlineIso) return 'Plazo pendiente';
  const ms = new Date(deadlineIso).getTime() - nowMs;
  if (ms <= 0) return 'Plazo vencido';

  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) {
    const dayLabel = days === 1 ? '1 día' : `${days} días`;
    return `${dayLabel} ${hours} h`;
  }
  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${String(seconds).padStart(2, '0')} s`;
  }
  return `${seconds} s`;
}
