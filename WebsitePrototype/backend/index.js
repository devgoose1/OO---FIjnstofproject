const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 5500;
const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

app.use(cors());
app.use(express.json());

initializeDb();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/datasets', (_req, res) => {
  const datasets = db
    .prepare(
      `SELECT d.id, d.name, d.original_filename AS originalFilename, d.created_at AS createdAt,
              d.row_count AS rowCount, d.column_names AS columnNames
         FROM datasets d
         ORDER BY d.created_at DESC`
    )
    .all()
    .map((row) => ({ ...row, columnNames: JSON.parse(row.columnNames || '[]') }));

  res.json({ datasets });
});

app.get('/api/datasets/:id', (req, res) => {
  const dataset = db
    .prepare(
      `SELECT d.id, d.name, d.original_filename AS originalFilename, d.created_at AS createdAt,
              d.row_count AS rowCount, d.column_names AS columnNames
         FROM datasets d WHERE d.id = ?`
    )
    .get(req.params.id);

  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not found' });
  }

  dataset.columnNames = JSON.parse(dataset.columnNames || '[]');
  res.json({ dataset });
});

app.get('/api/datasets/:id/rows', (req, res) => {
  const exists = db.prepare('SELECT 1 FROM datasets WHERE id = ?').get(req.params.id)
  if (!exists) {
    return res.status(404).json({ error: 'Dataset not found' })
  }

  const rows = db
    .prepare('SELECT row_json AS rowJson FROM dataset_rows WHERE dataset_id = ?')
    .all(req.params.id)
    .map((r) => JSON.parse(r.rowJson));

  res.json({ rows });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const records = await parseCsv(req.file.buffer);

    if (!records.length) {
      return res.status(400).json({ error: 'CSV contained no records' });
    }

    const columnNames = Object.keys(records[0]);
    const datasetName = req.body.name || deriveDatasetName(req.file.originalname);

    const insertDataset = db.prepare(
      'INSERT INTO datasets (name, original_filename, created_at, row_count, column_names) VALUES (?, ?, ?, ?, ?)'
    );

    const nowIso = new Date().toISOString();
    const info = insertDataset.run(
      datasetName,
      req.file.originalname,
      nowIso,
      records.length,
      JSON.stringify(columnNames)
    );

    const datasetId = info.lastInsertRowid;
    const insertRow = db.prepare('INSERT INTO dataset_rows (dataset_id, row_json) VALUES (?, ?)');
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insertRow.run(datasetId, JSON.stringify(row));
      }
    });
    insertMany(records);

    res.status(201).json({
      dataset: {
        id: datasetId,
        name: datasetName,
        originalFilename: req.file.originalname,
        createdAt: nowIso,
        rowCount: records.length,
        columnNames,
      },
    });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to process CSV upload' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on('close', () => {
  console.log('HTTP server closed');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('beforeExit', (code) => {
  console.warn('Process beforeExit with code', code);
});

process.on('exit', (code) => {
  console.warn('Process exit with code', code);
});

// Keep the event loop active so the process does not exit immediately in some environments.
setInterval(() => {
  // no-op heartbeat to keep server alive
}, 60_000);

function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const textSample = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
    const delimiter = sniffDelimiter(textSample);

    parse(
      buffer,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter,
      },
      (err, records) => {
        if (err) return reject(err);
        resolve(records);
      }
    );
  });
}

function sniffDelimiter(sample) {
  const firstLine = sample.split(/\r?\n/)[0] || '';
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
    '|': (firstLine.match(/\|/g) || []).length,
  };
  let best = ',';
  let bestCount = counts[','];
  for (const [delim, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = delim === '\\t' ? '\t' : delim;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : ',';
}

function deriveDatasetName(filename) {
  const base = filename.split(/\\|\//).pop() || 'dataset';
  return base.replace(/\.[^.]+$/, '') || 'dataset';
}

function initializeDb() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      original_filename TEXT,
      created_at TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      column_names TEXT NOT NULL
    )`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS dataset_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      row_json TEXT NOT NULL,
      FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )`
  ).run();

  // Ensure foreign keys are enforced
  db.prepare('PRAGMA foreign_keys = ON').run();
}
