import express from 'express';
import cors from 'cors';
import database from './config/database.js';
import apiRoutes from './routes/api.js';

/**
 * Hoofdserver bestand
 * Configureer Express server en start de applicatie
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Sta cross-origin requests toe (voor frontend)
app.use(express.json());  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fijnstof API is actief' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint niet gevonden' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server fout:', err);
  res.status(500).json({ 
    error: 'Server fout',
    message: err.message 
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialiseer database
    await database.initialize();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Fijnstof API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server draait op: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints: http://localhost:${PORT}/api`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Fout bij starten server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Server wordt afgesloten...');
  await database.close();
  process.exit(0);
});

// Start de server
startServer();
