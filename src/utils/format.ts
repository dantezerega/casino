/** Display formatting helpers. Pure, no deps. */

const currencyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 → "1,234.50" */
export const formatCurrency = (n: number): string => currencyFmt.format(n);

/** 1.2345 → "1.23×" */
export const formatMultiplier = (n: number): string =>
  `${(Math.round(n * 100) / 100).toFixed(2)}×`;

/** Shorten a long hex seed for compact display: abcd…wxyz */
export const truncateSeed = (seed: string, edge = 6): string =>
  seed.length <= edge * 2 ? seed : `${seed.slice(0, edge)}…${seed.slice(-edge)}`;
