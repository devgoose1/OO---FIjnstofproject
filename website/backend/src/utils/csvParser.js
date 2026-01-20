import Papa from 'papaparse';
import { formatInTimeZone } from 'date-fns-tz';
import fs from 'fs/promises';

/**
 * Utility functies voor CSV parsing en tijdzone conversie
 */

/**
 * Parse CSV bestand met puntkomma als scheidingsteken
 * @param {string} filePath - Pad naar CSV bestand
 * @returns {Array} Geparsede data rijen
 */
export async function parseCSV(filePath) {
  try {
    // Lees bestand
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse met Papa Parse
    const result = Papa.parse(fileContent, {
      delimiter: ';',  // Puntkomma scheidingsteken
      header: true,    // Eerste rij is header
      skipEmptyLines: true,
      dynamicTyping: true  // Converteer automatisch naar getallen
    });

    if (result.errors.length > 0) {
      console.error('CSV parse fouten:', result.errors);
      throw new Error('Fout bij het parsen van CSV bestand');
    }

    return result.data;
  } catch (error) {
    console.error('Fout bij lezen CSV:', error);
    throw error;
  }
}

/**
 * Converteer Unix timestamp naar Europe/Amsterdam tijdzone
 * @param {number} unixTimestamp - Unix timestamp in seconden
 * @returns {string} Datum/tijd string in formaat: "2024-01-20 14:30:00"
 */
export function convertToAmsterdamTime(unixTimestamp) {
  try {
    // Converteer seconden naar milliseconden
    const date = new Date(unixTimestamp * 1000);
    
    // Format naar Europe/Amsterdam tijdzone
    const formatted = formatInTimeZone(
      date,
      'Europe/Amsterdam',
      'yyyy-MM-dd HH:mm:ss'
    );
    
    return formatted;
  } catch (error) {
    console.error('Tijdzone conversie fout:', error);
    throw error;
  }
}

/**
 * Valideer CSV data structuur
 * Controleert of alle vereiste kolommen aanwezig zijn
 * @param {Array} data - Geparsede CSV data
 * @returns {boolean} True als valide
 */
export function validateCSVStructure(data) {
  if (!data || data.length === 0) {
    throw new Error('CSV bestand is leeg');
  }

  const firstRow = data[0];
  const requiredFields = ['tijd s', 'pm 1.0 ug/m3', 'pm 2.5 ug/m3', 'pm 4.0 ug/m3', 'pm 10 ug/m3'];
  
  for (const field of requiredFields) {
    if (!(field in firstRow)) {
      throw new Error(`Vereiste kolom ontbreekt: ${field}`);
    }
  }

  return true;
}

/**
 * Transformeer CSV data naar database formaat
 * @param {Array} csvData - Geparsede CSV data
 * @param {number} seriesId - ID van de meetserie
 * @returns {Array} Array van datapunt objecten klaar voor database
 */
export function transformCSVToDataPoints(csvData, seriesId) {
  return csvData.map(row => {
    const unixTimestamp = row['tijd s'];
    const datetimeLocal = convertToAmsterdamTime(unixTimestamp);

    return {
      seriesId: seriesId,
      unixTimestamp: unixTimestamp,
      datetimeLocal: datetimeLocal,
      pm1_0: parseFloat(row['pm 1.0 ug/m3']),
      pm2_5: parseFloat(row['pm 2.5 ug/m3']),
      pm4_0: parseFloat(row['pm 4.0 ug/m3']),
      pm10: parseFloat(row['pm 10 ug/m3'])
    };
  });
}

/**
 * Verwijder tijdelijk geüpload bestand
 * @param {string} filePath - Pad naar bestand
 */
export async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Fout bij verwijderen bestand:', error);
  }
}
