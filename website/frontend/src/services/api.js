import axios from 'axios';

/**
 * API Service voor communicatie met backend
 * Basis URL wordt automatisch ingesteld via Vite proxy
 */

const API_BASE_URL = '/api';

/**
 * Upload een CSV bestand met locatie
 * @param {File} file - CSV bestand
 * @param {string} location - Locatie van de meting
 */
export async function uploadMeasurement(file, location) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('location', location);

  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

/**
 * Haal alle meetseries op
 */
export async function getAllMeasurements() {
  const response = await axios.get(`${API_BASE_URL}/measurements`);
  return response.data;
}

/**
 * Haal een specifieke meetserie op met alle datapunten
 * @param {number} id - Serie ID
 */
export async function getMeasurementById(id) {
  const response = await axios.get(`${API_BASE_URL}/measurements/${id}`);
  return response.data;
}

/**
 * Vergelijk meerdere meetseries
 * @param {Array<number>} ids - Array van serie IDs
 */
export async function compareMeasurements(ids) {
  const idsParam = ids.join(',');
  const response = await axios.get(`${API_BASE_URL}/measurements/compare?ids=${idsParam}`);
  return response.data;
}

/**
 * Verwijder een meetserie
 * @param {number} id - Serie ID
 */
export async function deleteMeasurement(id) {
  const response = await axios.delete(`${API_BASE_URL}/measurements/${id}`);
  return response.data;
}
