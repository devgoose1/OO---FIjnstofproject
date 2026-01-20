import MeasurementSeries from '../models/MeasurementSeries.js';
import DataPoint from '../models/DataPoint.js';
import { 
  parseCSV, 
  validateCSVStructure, 
  transformCSVToDataPoints,
  cleanupFile 
} from '../utils/csvParser.js';

/**
 * Controller voor measurement endpoints
 * Bevat alle business logic voor API routes
 */

/**
 * POST /api/upload
 * Upload CSV bestand met locatie
 */
export async function uploadMeasurement(req, res) {
  try {
    // Valideer request
    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const { location } = req.body;
    if (!location || location.trim() === '') {
      await cleanupFile(req.file.path);
      return res.status(400).json({ error: 'Locatie is verplicht' });
    }

    console.log(`📤 Upload ontvangen: ${req.file.originalname} voor locatie: ${location}`);

    // Parse CSV bestand
    const csvData = await parseCSV(req.file.path);
    validateCSVStructure(csvData);

    // Maak nieuwe meetserie aan
    const uploadDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const seriesId = await MeasurementSeries.create(location, uploadDate);

    // Transformeer en sla datapunten op
    const dataPoints = transformCSVToDataPoints(csvData, seriesId);
    await DataPoint.createBulk(dataPoints);

    // Update aantal datapunten in serie
    await MeasurementSeries.updateDataPointCount(seriesId, dataPoints.length);

    // Cleanup tijdelijk bestand
    await cleanupFile(req.file.path);

    console.log(`✓ Serie ${seriesId} aangemaakt met ${dataPoints.length} datapunten`);

    res.status(201).json({
      message: 'Upload succesvol',
      seriesId: seriesId,
      location: location,
      dataPointCount: dataPoints.length
    });

  } catch (error) {
    console.error('Upload fout:', error);
    
    // Cleanup bij fout
    if (req.file) {
      await cleanupFile(req.file.path);
    }

    res.status(500).json({ 
      error: 'Fout bij verwerken upload',
      details: error.message 
    });
  }
}

/**
 * GET /api/measurements
 * Haal alle meetseries op (overzichtspagina)
 */
export async function getAllMeasurements(req, res) {
  try {
    const series = await MeasurementSeries.getAll();

    res.json({
      count: series.length,
      series: series
    });

  } catch (error) {
    console.error('Fout bij ophalen metingen:', error);
    res.status(500).json({ error: 'Fout bij ophalen metingen' });
  }
}

/**
 * GET /api/measurements/:id
 * Haal specifieke meetserie met alle datapunten op (detailpagina)
 */
export async function getMeasurementById(req, res) {
  try {
    const { id } = req.params;

    // Haal serie info op
    const series = await MeasurementSeries.getById(id);
    if (!series) {
      return res.status(404).json({ error: 'Meetserie niet gevonden' });
    }

    // Haal alle datapunten op
    const dataPoints = await DataPoint.getBySeriesId(id);

    // Bereken statistieken
    const statistics = await DataPoint.getStatistics(id);

    res.json({
      series: series,
      dataPoints: dataPoints,
      statistics: statistics
    });

  } catch (error) {
    console.error('Fout bij ophalen meting:', error);
    res.status(500).json({ error: 'Fout bij ophalen meting' });
  }
}

/**
 * GET /api/measurements/compare
 * Haal meerdere series op voor vergelijking
 * Query parameter: ids (komma-gescheiden, bv. ?ids=1,2,3)
 */
export async function compareMeasurements(req, res) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'Geen serie IDs opgegeven' });
    }

    // Parse IDs
    const seriesIds = ids.split(',').map(id => parseInt(id));

    if (seriesIds.some(id => isNaN(id))) {
      return res.status(400).json({ error: 'Ongeldige serie IDs' });
    }

    // Haal series info op
    const seriesPromises = seriesIds.map(id => MeasurementSeries.getById(id));
    const seriesData = await Promise.all(seriesPromises);

    // Check of alle series bestaan
    if (seriesData.some(s => !s)) {
      return res.status(404).json({ error: 'Één of meer series niet gevonden' });
    }

    // Haal alle datapunten op
    const dataPoints = await DataPoint.getByMultipleSeriesIds(seriesIds);

    // Groepeer datapunten per serie
    const groupedDataPoints = {};
    seriesIds.forEach(id => {
      groupedDataPoints[id] = dataPoints.filter(dp => dp.series_id === id);
    });

    res.json({
      series: seriesData,
      dataPoints: groupedDataPoints
    });

  } catch (error) {
    console.error('Fout bij vergelijken metingen:', error);
    res.status(500).json({ error: 'Fout bij vergelijken metingen' });
  }
}

/**
 * DELETE /api/measurements/:id
 * Verwijder een meetserie (inclusief alle datapunten)
 */
export async function deleteMeasurement(req, res) {
  try {
    const { id } = req.params;

    // Check of serie bestaat
    const series = await MeasurementSeries.getById(id);
    if (!series) {
      return res.status(404).json({ error: 'Meetserie niet gevonden' });
    }

    // Verwijder serie (cascade verwijdert datapunten automatisch)
    await MeasurementSeries.delete(id);

    console.log(`🗑️  Serie ${id} verwijderd`);

    res.json({ message: 'Meetserie verwijderd' });

  } catch (error) {
    console.error('Fout bij verwijderen meting:', error);
    res.status(500).json({ error: 'Fout bij verwijderen meting' });
  }
}
