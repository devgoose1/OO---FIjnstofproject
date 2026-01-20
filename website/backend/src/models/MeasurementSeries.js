import database from '../config/database.js';

/**
 * Model voor measurement_series tabel
 * Beheert meetseries (één per CSV upload)
 */
class MeasurementSeries {
  /**
   * Maak een nieuwe meetserie aan
   * @param {string} location - Locatie van de meting (bv. "Utrecht - Balkon")
   * @param {string} uploadDate - Datum van upload (ISO formaat)
   * @returns {number} ID van de nieuwe serie
   */
  static async create(location, uploadDate) {
    const sql = `
      INSERT INTO measurement_series (location, upload_date)
      VALUES (?, ?)
    `;
    const result = await database.run(sql, [location, uploadDate]);
    return result.id;
  }

  /**
   * Haal alle meetseries op (voor overzichtspagina)
   * Gesorteerd op nieuwste eerst
   */
  static async getAll() {
    const sql = `
      SELECT 
        id,
        location,
        upload_date,
        data_point_count,
        created_at
      FROM measurement_series
      ORDER BY created_at DESC
    `;
    return await database.all(sql);
  }

  /**
   * Haal één specifieke meetserie op
   * @param {number} id - Serie ID
   */
  static async getById(id) {
    const sql = `
      SELECT 
        id,
        location,
        upload_date,
        data_point_count,
        created_at
      FROM measurement_series
      WHERE id = ?
    `;
    return await database.get(sql, [id]);
  }

  /**
   * Haal meetseries op gefilterd op locatie
   * @param {string} location - Locatie om op te filteren
   */
  static async getByLocation(location) {
    const sql = `
      SELECT 
        id,
        location,
        upload_date,
        data_point_count,
        created_at
      FROM measurement_series
      WHERE location LIKE ?
      ORDER BY created_at DESC
    `;
    return await database.all(sql, [`%${location}%`]);
  }

  /**
   * Update het aantal datapunten in een serie
   * @param {number} id - Serie ID
   * @param {number} count - Aantal datapunten
   */
  static async updateDataPointCount(id, count) {
    const sql = `
      UPDATE measurement_series
      SET data_point_count = ?
      WHERE id = ?
    `;
    return await database.run(sql, [count, id]);
  }

  /**
   * Verwijder een meetserie (cascade verwijdert ook datapunten)
   * @param {number} id - Serie ID
   */
  static async delete(id) {
    const sql = `DELETE FROM measurement_series WHERE id = ?`;
    return await database.run(sql, [id]);
  }
}

export default MeasurementSeries;
