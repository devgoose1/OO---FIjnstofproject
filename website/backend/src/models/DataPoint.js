import database from '../config/database.js';

/**
 * Model voor data_points tabel
 * Beheert individuele meetpunten binnen een serie
 */
class DataPoint {
  /**
   * Voeg een enkel datapunt toe
   * @param {number} seriesId - ID van de meetserie
   * @param {number} unixTimestamp - Unix timestamp in seconden
   * @param {string} datetimeLocal - Geconverteerde datum/tijd (Europe/Amsterdam)
   * @param {number} pm1_0 - PM1.0 waarde
   * @param {number} pm2_5 - PM2.5 waarde
   * @param {number} pm4_0 - PM4.0 waarde
   * @param {number} pm10 - PM10 waarde
   */
  static async create(seriesId, unixTimestamp, datetimeLocal, pm1_0, pm2_5, pm4_0, pm10) {
    const sql = `
      INSERT INTO data_points 
      (series_id, unix_timestamp, datetime_local, pm1_0, pm2_5, pm4_0, pm10)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return await database.run(sql, [
      seriesId,
      unixTimestamp,
      datetimeLocal,
      pm1_0,
      pm2_5,
      pm4_0,
      pm10
    ]);
  }

  /**
   * Voeg meerdere datapunten toe in één transactie (veel sneller)
   * @param {Array} dataPoints - Array van datapunt objecten
   */
  static async createBulk(dataPoints) {
    // Gebruik transactie voor snelheid
    await database.run('BEGIN TRANSACTION');
    
    try {
      const sql = `
        INSERT INTO data_points 
        (series_id, unix_timestamp, datetime_local, pm1_0, pm2_5, pm4_0, pm10)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      for (const point of dataPoints) {
        await database.run(sql, [
          point.seriesId,
          point.unixTimestamp,
          point.datetimeLocal,
          point.pm1_0,
          point.pm2_5,
          point.pm4_0,
          point.pm10
        ]);
      }

      await database.run('COMMIT');
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Haal alle datapunten van een specifieke serie op
   * @param {number} seriesId - ID van de meetserie
   * Gesorteerd op tijd (oudste eerst)
   */
  static async getBySeriesId(seriesId) {
    const sql = `
      SELECT 
        id,
        unix_timestamp,
        datetime_local,
        pm1_0,
        pm2_5,
        pm4_0,
        pm10
      FROM data_points
      WHERE series_id = ?
      ORDER BY unix_timestamp ASC
    `;
    return await database.all(sql, [seriesId]);
  }

  /**
   * Haal datapunten op voor meerdere series (voor vergelijking)
   * @param {Array<number>} seriesIds - Array van serie IDs
   */
  static async getByMultipleSeriesIds(seriesIds) {
    // Maak placeholders voor SQL query (?, ?, ?)
    const placeholders = seriesIds.map(() => '?').join(',');
    
    const sql = `
      SELECT 
        series_id,
        unix_timestamp,
        datetime_local,
        pm1_0,
        pm2_5,
        pm4_0,
        pm10
      FROM data_points
      WHERE series_id IN (${placeholders})
      ORDER BY series_id, unix_timestamp ASC
    `;
    return await database.all(sql, seriesIds);
  }

  /**
   * Tel aantal datapunten in een serie
   * @param {number} seriesId - ID van de meetserie
   */
  static async countBySeriesId(seriesId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM data_points
      WHERE series_id = ?
    `;
    const result = await database.get(sql, [seriesId]);
    return result.count;
  }

  /**
   * Verwijder alle datapunten van een serie
   * @param {number} seriesId - ID van de meetserie
   */
  static async deleteBySeriesId(seriesId) {
    const sql = `DELETE FROM data_points WHERE series_id = ?`;
    return await database.run(sql, [seriesId]);
  }

  /**
   * Bereken statistieken voor een serie
   * @param {number} seriesId - ID van de meetserie
   */
  static async getStatistics(seriesId) {
    const sql = `
      SELECT 
        AVG(pm1_0) as avg_pm1_0,
        AVG(pm2_5) as avg_pm2_5,
        AVG(pm4_0) as avg_pm4_0,
        AVG(pm10) as avg_pm10,
        MAX(pm1_0) as max_pm1_0,
        MAX(pm2_5) as max_pm2_5,
        MAX(pm4_0) as max_pm4_0,
        MAX(pm10) as max_pm10,
        MIN(pm1_0) as min_pm1_0,
        MIN(pm2_5) as min_pm2_5,
        MIN(pm4_0) as min_pm4_0,
        MIN(pm10) as min_pm10
      FROM data_points
      WHERE series_id = ?
    `;
    return await database.get(sql, [seriesId]);
  }
}

export default DataPoint;
