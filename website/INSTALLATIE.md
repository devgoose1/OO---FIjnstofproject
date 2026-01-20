# 🚀 Installatie & Start Instructies

## Vereisten

- Node.js 18 of hoger
- NPM of Yarn

## Stap 1: Backend Installeren en Starten

Open een terminal en navigeer naar de backend folder:

```bash
cd backend
npm install
```

Start de backend server (development mode met auto-reload):

```bash
npm run dev
```

De backend draait nu op **<http://localhost:3000>**

## Stap 2: Frontend Installeren en Starten

Open een **nieuwe terminal** en navigeer naar de frontend folder:

```bash
cd frontend
npm install
```

Start de frontend development server:

```bash
npm run dev
```

De frontend draait nu op **<http://localhost:5173>**

## Gebruik

1. Open je browser en ga naar **<http://localhost:5173>**
2. Upload het voorbeeldbestand `voorbeeld-meting.csv` op de upload pagina
3. Vul een locatie in (bijv. "Utrecht - Balkon")
4. Bekijk de resultaten in het overzicht
5. Klik op een meting om details en grafieken te zien
6. Vergelijk meerdere metingen op de vergelijkingspagina

## API Testen

Je kunt de API direct testen via:

- Health check: <http://localhost:3000/health>
- Alle metingen: <http://localhost:3000/api/measurements>

## Productie Build

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

De gebouwde bestanden staan in `frontend/dist/`

## Troubleshooting

### Port al in gebruik

Als poort 3000 of 5173 al in gebruik is, wijzig dan:

- Backend: pas `PORT` aan in `backend/src/server.js`
- Frontend: pas `server.port` aan in `frontend/vite.config.js`

### Database fouten

De SQLite database wordt automatisch aangemaakt in `backend/database/`. Als er problemen zijn, verwijder de database en herstart de backend.

### CORS fouten

De Vite proxy is geconfigureerd om CORS problemen te voorkomen. Zorg dat beide servers draaien.
