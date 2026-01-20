# Fijnstof Analyse Webapplicatie

Een complete webapplicatie voor het uploaden, opslaan en analyseren van fijnstof CSV-metingen.

## 📂 Projectstructuur

```text
website/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database configuratie
│   │   ├── controllers/  # Business logic
│   │   ├── models/   # Database models
│   │   ├── routes/   # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── utils/    # Helper functies
│   ├── database/     # SQLite database
│   └── uploads/      # Tijdelijke CSV uploads
├── frontend/         # React applicatie
│   ├── src/
│   │   ├── components/   # Herbruikbare componenten
│   │   ├── pages/    # Pagina componenten
│   │   ├── services/ # API communicatie
│   │   └── utils/    # Helper functies
└── README.md
```

## 🚀 Installatie & Starten

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend draait op: <http://localhost:3000>

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend draait op: <http://localhost:5173>

## 🎯 Functionaliteit

- ✅ CSV upload met locatie invoer
- ✅ Permanente database opslag (SQLite)
- ✅ Unix timestamp conversie naar Europe/Amsterdam
- ✅ Overzicht van alle meetseries
- ✅ Detailpagina met grafieken en tabellen
- ✅ Vergelijken van meerdere meetseries
- ✅ Filters op locatie en datum

## 📊 CSV Formaat

```csv
tijd s;pm 1.0 ug/m3;pm 2.5 ug/m3;pm 4.0 ug/m3;pm 10 ug/m3
1765376903;2.5168928;2.8842468;3.3804901;3.9554002
```

- Scheidingsteken: puntkomma (;)
- tijd s: Unix timestamp in seconden
- PM waarden: fijnstof concentraties in ug/m3

## 🛠 Technologie Stack

**Backend:**

- Node.js + Express
- SQLite database
- Papa Parse (CSV parsing)
- date-fns-tz (tijdzone conversie)

**Frontend:**

- React + Vite
- Recharts (grafieken)
- Axios (API calls)
- React Router (navigatie)

## 📡 API Endpoints

- `POST /api/upload` - Upload CSV met locatie
- `GET /api/measurements` - Alle meetseries ophalen
- `GET /api/measurements/:id` - Specifieke meetserie met datapunten
- `GET /api/measurements/compare` - Meerdere series vergelijken
