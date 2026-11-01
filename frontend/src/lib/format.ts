import Decimal from "decimal.js";

/** Decimal-safe money arithmetic helpers — never floats. */
export const D = (v: string | number | Decimal | null | undefined): Decimal =>
  new Decimal(v ?? 0);

const LOC = "ar-EG-u-nu-latn"; // Arabic locale, Western (Latin) digits — matches spec & tabular-nums
const nf2 = new Intl.NumberFormat(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf3 = new Intl.NumberFormat(LOC, { maximumFractionDigits: 3 });

export const money = (v: string | number | Decimal | null | undefined): string =>
  nf2.format(Number(D(v).toDecimalPlaces(2).toFixed(2)));

export const moneyEGP = (v: string | number | Decimal | null | undefined): string =>
  `${money(v)} ج.م`;

export const qty = (v: string | number | Decimal | null | undefined): string =>
  nf3.format(Number(D(v).toDecimalPlaces(3).toFixed(3)));

const dtf = new Intl.DateTimeFormat(LOC, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
const df = new Intl.DateTimeFormat(LOC, { dateStyle: "medium", timeZone: "Africa/Cairo" });

export const dateTime = (v: string | Date | null | undefined): string =>
  v ? dtf.format(new Date(v)) : "—";

export const date = (v: string | Date | null | undefined): string =>
  v ? df.format(new Date(v)) : "—";

/* Prototype-named wrappers used by the ported shadcn views */
export const formatMoney = (v: number): string => money(v);
export const formatCurrency = (v: number | string | Decimal | null | undefined, currency: string = "USD"): string => {
  const val = Number(D(v).toDecimalPlaces(2).toFixed(2));
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);
  } catch {
    return `${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
};
export const formatNumber = (v: number): string => qty(v);
export const formatDate = (iso: string): string => date(iso);
export const formatDateTime = (iso: string): string => dateTime(iso);
export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat(LOC, { timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));

