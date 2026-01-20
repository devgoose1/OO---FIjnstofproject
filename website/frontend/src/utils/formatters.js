import { format, parseISO } from 'date-fns';

/**
 * Format datum voor weergave
 * @param {string} dateString - ISO datum string
 * @returns {string} Geformatteerde datum (DD-MM-YYYY)
 */
export function formatDate(dateString) {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd-MM-yyyy');
  } catch (error) {
    return dateString;
  }
}

/**
 * Format datum/tijd voor weergave
 * @param {string} datetimeString - Datum/tijd string
 * @returns {string} Geformatteerde datum/tijd (DD-MM-YYYY HH:mm:ss)
 */
export function formatDateTime(datetimeString) {
  try {
    const date = new Date(datetimeString);
    return format(date, 'dd-MM-yyyy HH:mm:ss');
  } catch (error) {
    return datetimeString;
  }
}

/**
 * Format getal met decimalen
 * @param {number} value - Numerieke waarde
 * @param {number} decimals - Aantal decimalen (standaard 2)
 * @returns {string} Geformatteerd getal
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(decimals);
}

/**
 * Bereken gemiddelde van array
 * @param {Array<number>} values - Array van getallen
 * @returns {number} Gemiddelde waarde
 */
export function calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
