// Utilidades compartidas de Lana.
// Regla de oro del proyecto: el dinero SIEMPRE viaja en centavos (enteros).
// Solo fmtMoney/parseMoney tocan la frontera con pesos decimales.

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ---------- Dinero ---------- */

const fmtMXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});
const fmtMXNEntero = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export function fmtMoney(centavos) {
  return fmtMXN.format((centavos || 0) / 100);
}

// Para montos grandes en tarjetas del dashboard: sin centavos si es cifra redonda.
export function fmtMoneyCorto(centavos) {
  const c = centavos || 0;
  return c % 100 === 0 ? fmtMXNEntero.format(c / 100) : fmtMXN.format(c / 100);
}

// Acepta "1,234.56", "$1234", "1 234", "1234.5" → centavos (entero) o null si no es un monto.
export function parseMoney(str) {
  if (typeof str === 'number') return Math.round(str * 100);
  if (!str) return null;
  const limpio = String(str).replace(/[$\s,]/g, '').replace(/[^0-9.-]/g, '');
  if (!limpio || limpio === '-' || limpio === '.') return null;
  const num = Number(limpio);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

/* ---------- Fechas (siempre strings locales 'YYYY-MM-DD' / 'YYYY-MM') ---------- */

const pad = (n) => String(n).padStart(2, '0');

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const mesKeyDe = (iso) => (iso || '').slice(0, 7);
export const mesActualKey = () => mesKeyDe(hoyISO());
export const diaDe = (iso) => Number((iso || '').slice(8, 10));

export function diasEnMes(mesKey) {
  const [a, m] = mesKey.split('-').map(Number);
  return new Date(a, m, 0).getDate();
}

// Día de pago 31 en un mes de 30 → 30 (o 28/29 en febrero).
export function clampDia(dia, mesKey) {
  return Math.max(1, Math.min(Number(dia) || 1, diasEnMes(mesKey)));
}

export function fechaISO(mesKey, dia) {
  return `${mesKey}-${pad(clampDia(dia, mesKey))}`;
}

export function sumarMeses(mesKey, n) {
  const [a, m] = mesKey.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function sumarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(a, m - 1, d + n);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];
export const DIAS_SEMANA_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function nombreMes(mesKey) {
  const [a, m] = mesKey.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}

export function fechaCorta(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_CORTOS[m - 1]}`;
}

export function fechaLarga(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

// Lunes=0 … Domingo=6, para pintar el calendario.
export function diaSemanaLunes0(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return (new Date(a, m - 1, d).getDay() + 6) % 7;
}

export function etiquetaRelativa(iso) {
  const hoy = hoyISO();
  if (iso === hoy) return 'hoy';
  if (iso === sumarDias(hoy, 1)) return 'mañana';
  return fechaCorta(iso);
}

/* ---------- Varios ---------- */

export function pct(parte, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((parte / total) * 100)));
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function plural(n, uno, varios) {
  return n === 1 ? uno : varios;
}
