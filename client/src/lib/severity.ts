import type { AlertSeverity } from '@parivahan/shared';

interface SeverityStyle {
  container: string;
  badge: string;
  label: string;
  button: string;
}

/**
 * Single source of truth for how a severity level looks, wherever it
 * renders — the dashboard's autopilot banner and the Alerts list both read
 * from this instead of each hardcoding their own colors, so a critical
 * notification can't render calm in one place and urgent in another.
 */
export const SEVERITY_STYLES: Record<AlertSeverity, SeverityStyle> = {
  critical: {
    container: 'border-rose-500/30 bg-rose-500/10',
    badge: 'bg-rose-500/10 text-rose-300',
    label: 'text-rose-300',
    button: 'bg-rose-500 text-slate-950 hover:bg-rose-400'
  },
  warning: {
    container: 'border-amber-500/30 bg-amber-500/10',
    badge: 'bg-amber-500/10 text-amber-300',
    label: 'text-amber-300',
    button: 'bg-amber-400 text-slate-950 hover:bg-amber-300'
  },
  info: {
    container: 'border-slate-700 bg-slate-500/10',
    badge: 'bg-slate-500/10 text-slate-300',
    label: 'text-slate-300',
    button: 'bg-slate-700 text-slate-100 hover:bg-slate-600'
  }
};
