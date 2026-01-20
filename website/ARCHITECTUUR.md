# 📐 Technische Architectuur

## Overzicht

De fijnstof webapplicatie is opgebouwd volgens een drielagenarchitectuur:

1. **Frontend** - React SPA
2. **Backend** - Node.js REST API
3. **Database** - SQLite

---

## 🗄️ Database Schema

### Tabel: `measurement_series`

Eén rij per CSV upload.

| Kolom | Type | Beschrijving |
| ------ | ------ | -------------- |
| `id` | INTEGER PRIMARY KEY | Unieke serie ID |
| `location` | TEXT NOT NULL | Locatie van de meting |
| `upload_date` | TEXT NOT NULL | Datum van upload (YYYY-MM-DD) |
| `data_point_count` | INTEGER | Aantal meetpunten in serie |
| `created_at` | DATETIME | Tijdstip van aanmaak |

**Indexes:**

- `idx_series_location` op `location`
- `idx_series_upload_date` op `upload_date`

### Tabel: `data_points`

Vele rijen per serie (1:N relatie).

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| `id` | INTEGER PRIMARY KEY | Unieke datapunt ID |
| `series_id` | INTEGER NOT NULL | Foreign key naar measurement_series |
| `unix_timestamp` | INTEGER NOT NULL | Unix timestamp (seconden) |
| `datetime_local` | TEXT NOT NULL | Geconverteerde tijd (Europe/Amsterdam) |
| `pm1_0` | REAL NOT NULL | PM1.0 concentratie (µg/m³) |
| `pm2_5` | REAL NOT NULL | PM2.5 concentratie (µg/m³) |
| `pm4_0` | REAL NOT NULL | PM4.0 concentratie (µg/m³) |
| `pm10` | REAL NOT NULL | PM10 concentratie (µg/m³) |

**Indexes:**

- `idx_datapoints_series` op `series_id`
- `idx_datapoints_datetime` op `datetime_local`

**Foreign Key:** `series_id` → `measurement_series(id)` met `ON DELETE CASCADE`

---

## 🔌 API Endpoints

### POST /api/upload

Upload een CSV bestand met locatie.

**Request:**

- Content-Type: `multipart/form-data`
- Body:
  - `file`: CSV bestand
  - `location`: String (locatie naam)

**Response:**

```json
{
  "message": "Upload succesvol",
  "seriesId": 1,
  "location": "Utrecht - Balkon",
  "dataPointCount": 1234
}
```

### GET /api/measurements

Haal alle meetseries op.

**Response:**

```json
{
  "count": 5,
  "series": [
    {
      "id": 1,
      "location": "Utrecht - Balkon",
      "upload_date": "2026-01-20",
      "data_point_count": 1234,
      "created_at": "2026-01-20 15:30:00"
    }
  ]
}
```

### GET /api/measurements/:id

Haal specifieke meetserie met alle datapunten.

**Response:**

```json
{
  "series": { /* serie info */ },
  "dataPoints": [
    {
      "id": 1,
      "unix_timestamp": 1705753200,
      "datetime_local": "2024-01-20 12:00:00",
      "pm1_0": 2.52,
      "pm2_5": 2.88,
      "pm4_0": 3.38,
      "pm10": 3.96
    }
  ],
  "statistics": {
    "avg_pm1_0": 2.55,
    "max_pm1_0": 3.20,
    "min_pm1_0": 2.10,
    /* ... voor pm2_5, pm4_0, pm10 */
  }
}
```

### GET /api/measurements/compare?ids=1,2,3

Vergelijk meerdere series.

**Query params:** `ids` - Komma-gescheiden serie IDs

**Response:**

```json
{
  "series": [/* array van serie info */],
  "dataPoints": {
    "1": [/* datapunten voor serie 1 */],
    "2": [/* datapunten voor serie 2 */]
  }
}
```

### DELETE /api/measurements/:id

Verwijder een meetserie (cascade verwijdert datapunten).

**Response:**

```json
{
  "message": "Meetserie verwijderd"
}
```

---

## 📂 Backend Architectuur

```
backend/src/
├── config/
│   └── database.js          # SQLite configuratie & setup
├── models/
│   ├── MeasurementSeries.js # Serie CRUD operaties
│   └── DataPoint.js         # Datapunt CRUD operaties
├── controllers/
│   └── measurementController.js  # Business logic
├── routes/
│   └── api.js               # Route definities
├── middleware/
│   └── upload.js            # Multer file upload config
├── utils/
│   └── csvParser.js         # CSV parsing & tijdzone conversie
└── server.js                # Express server entry point
```

### Belangrijke Concepten

**Database Singleton Pattern:**

- `database.js` exporteert één instantie
- Voorkomt meerdere database connecties
- Biedt handige wrappers (`run()`, `get()`, `all()`)

**Model Layer:**

- Statische methoden voor database operaties
- Geen directe SQL in controllers
- Makkelijk testbaar en herbruikbaar

**CSV Parsing Flow:**

1. Multer slaat bestand tijdelijk op
2. Papa Parse leest CSV (puntkomma delimiter)
3. Validatie van structuur
4. Unix timestamp → Europe/Amsterdam conversie
5. Bulk insert in database (transactie)
6. Cleanup van tijdelijk bestand

**Tijdzone Conversie:**

```javascript
import { formatInTimeZone } from 'date-fns-tz';

const date = new Date(unixTimestamp * 1000);
const formatted = formatInTimeZone(
  date, 
  'Europe/Amsterdam', 
  'yyyy-MM-dd HH:mm:ss'
);
```

---

## ⚛️ Frontend Architectuur

```
frontend/src/
├── components/
│   ├── PMChart.jsx          # Recharts grafiek voor 1 serie
│   └── ComparisonChart.jsx  # Recharts grafiek voor meerdere series
├── pages/
│   ├── UploadPage.jsx       # CSV upload met drag & drop
│   ├── OverviewPage.jsx     # Tabel met alle series
│   ├── DetailPage.jsx       # Detail + grafieken + tabel
│   └── ComparePage.jsx      # Multi-serie vergelijking
├── services/
│   └── api.js               # Axios API calls
├── utils/
│   └── formatters.js        # Datum/nummer formatting
├── App.jsx                  # Router & navigatie
└── main.jsx                 # Entry point
```

### React Router Routes

| Route | Component | Beschrijving |
|-------|-----------|--------------|
| `/` | UploadPage | CSV upload formulier |
| `/overview` | OverviewPage | Alle meetseries |
| `/detail/:id` | DetailPage | Detail van één serie |
| `/compare` | ComparePage | Vergelijk meerdere series |

### State Management

**Geen externe state library** - component state is voldoende:

- `useState` voor lokale state
- `useEffect` voor data fetching
- Props voor communicatie parent → child

### Grafieken met Recharts

**PMChart Component:**

- Toont één PM type voor één serie
- Gebruik van `LineChart`, `XAxis`, `YAxis`, `Tooltip`
- Custom tooltip met datum/tijd en waarde

**ComparisonChart Component:**

- Combineert meerdere series in één grafiek
- Elke serie krijgt unieke kleur
- Legend toont locatie namen

### Styling

- **Pure CSS** (geen framework)
- Responsive grid layout
- CSS variabelen voor kleuren mogelijk uit te breiden
- Mobile-first benadering

---

## 🔄 Data Flow Voorbeeld

### Upload Flow

```
User uploads CSV
    ↓
Frontend: UploadPage
    ↓ (FormData)
Backend: POST /api/upload
    ↓
Multer middleware (save to uploads/)
    ↓
measurementController.uploadMeasurement()
    ↓
csvParser.parseCSV() → Papa Parse
    ↓
csvParser.transformCSVToDataPoints() → tijdzone conversie
    ↓
MeasurementSeries.create() → insert serie
    ↓
DataPoint.createBulk() → bulk insert datapunten
    ↓
MeasurementSeries.updateDataPointCount()
    ↓
Cleanup tijdelijk bestand
    ↓
Response naar frontend
    ↓
Navigate naar /overview
```

### Detail View Flow

```
User clicks "Bekijken" in overview
    ↓
Navigate to /detail/:id
    ↓
DetailPage useEffect()
    ↓
Frontend: GET /api/measurements/:id
    ↓
Backend: measurementController.getMeasurementById()
    ↓
MeasurementSeries.getById()
DataPoint.getBySeriesId()
DataPoint.getStatistics()
    ↓
Response met series, dataPoints, statistics
    ↓
Render 4x PMChart component
Render tabel met paginering
```

---

## 🚀 Mogelijke Uitbreidingen

### 1. Gebruikersaccounts

- JWT authenticatie
- User model in database
- Serie ownership (user_id foreign key)
- Login/register pagina's

### 2. Data Export

- CSV export functie
- PNG grafiek export (html2canvas)
- PDF rapport generatie

### 3. Extra Sensoren

- Uitbreidbaar database schema
- Dynamische kolom detectie in CSV parser
- Configureerbare grafiek types

### 4. Real-time Updates

- WebSocket integratie
- Live data streaming
- Auto-refresh op overview pagina

### 5. Geavanceerde Analytics

- Correlatie analyses
- Voorspellende modellen
- Anomalie detectie

### 6. Deployment

- Docker containerization
- PostgreSQL voor productie
- NGINX reverse proxy
- CI/CD pipeline

---

## 📊 Performance Optimalisatie

**Database:**

- Indexes op frequently queried kolommen
- Bulk insert met transacties (100x sneller dan individuele inserts)
- Connection pooling mogelijk voor schaalvergroting

**Frontend:**

- Code splitting met React.lazy() mogelijk
- Memoization met React.memo() voor grafieken
- Virtualisatie voor lange tabellen (react-window)

**API:**

- Paginering voor grote datasets
- Caching headers
- Compression middleware

---

## 🔒 Beveiliging

**Huidige Implementatie:**

- File type validatie (.csv only)
- File size limit (10MB)
- SQL injection preventie (prepared statements)
- Input sanitization

**Voor Productie Nog Toevoegen:**

- Rate limiting
- HTTPS only
- CSRF tokens
- Content Security Policy headers
- Input validation met joi/zod
- File content scanning
