import express from 'express';
import upload from '../middleware/upload.js';
import {
  uploadMeasurement,
  getAllMeasurements,
  getMeasurementById,
  compareMeasurements,
  deleteMeasurement
} from '../controllers/measurementController.js';

const router = express.Router();

/**
 * API Routes voor fijnstof metingen
 */

// POST /api/upload - Upload CSV met locatie
router.post('/upload', upload.single('file'), uploadMeasurement);

// GET /api/measurements - Alle meetseries ophalen
router.get('/measurements', getAllMeasurements);

// GET /api/measurements/compare?ids=1,2,3 - Meerdere series vergelijken
router.get('/measurements/compare', compareMeasurements);

// GET /api/measurements/:id - Specifieke meetserie ophalen
router.get('/measurements/:id', getMeasurementById);

// DELETE /api/measurements/:id - Meetserie verwijderen
router.delete('/measurements/:id', deleteMeasurement);

export default router;
