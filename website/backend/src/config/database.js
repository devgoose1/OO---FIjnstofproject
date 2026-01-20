import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database bestand locatie
const DB_PATH = path.join(__dirname, '../../database/fijnstof.db');

/**
 * Database configuratie en initialisatie
 * SQLite database voor permanent opslaan van fijnstof metingen
 */
class Database {
  constructor() {
    this.db = null;
  }

  /**
   * Initialiseer database verbinding en maak tabellen aan
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Database connectie fout:', err);
          reject(err);
          return;
        }
        console.log('✓ Database verbonden:', DB_PATH);
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  /**
   * Maak database tabellen aan
   * Schema:
   * - measurement_series: meetseries (1 per upload)
   * - data_points: individuele meetpunten (veel per serie)
   */
  async createTables() {
    const createSeriesTable = `
      CREATE TABLE IF NOT EXISTS measurement_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        data_point_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createDataPointsTable = `
      CREATE TABLE IF NOT EXISTS data_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        unix_timestamp INTEGER NOT NULL,
        datetime_local TEXT NOT NULL,
        pm1_0 REAL NOT NULL,
        pm2_5 REAL NOT NULL,
        pm4_0 REAL NOT NULL,
        pm10 REAL NOT NULL,
        FOREIGN KEY (series_id) REFERENCES measurement_series(id) ON DELETE CASCADE
      )
    `;

    // Index voor snellere queries
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_series_location ON measurement_series(location);
      CREATE INDEX IF NOT EXISTS idx_series_upload_date ON measurement_series(upload_date);
      CREATE INDEX IF NOT EXISTS idx_datapoints_series ON data_points(series_id);
      CREATE INDEX IF NOT EXISTS idx_datapoints_datetime ON data_points(datetime_local);
    `;

    try {
      await this.run(createSeriesTable);
      await this.run(createDataPointsTable);
      await this.run(createIndexes);
      console.log('✓ Database tabellen aangemaakt');
    } catch (error) {
      console.error('Fout bij aanmaken tabellen:', error);
      throw error;
    }
  }

  /**
   * Voer een SQL query uit (INSERT, UPDATE, DELETE)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Haal één rij op (SELECT)
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Haal meerdere rijen op (SELECT)
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Sluit database verbinding
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Export singleton instantie
const database = new Database();
export default database;
