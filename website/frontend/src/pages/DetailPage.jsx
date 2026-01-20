import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeasurementById } from '../services/api';
import { formatDate, formatDateTime, formatNumber } from '../utils/formatters';
import PMChart from '../components/PMChart';

/**
 * Detailpagina component
 * Toont details van een specifieke meetserie met grafieken en tabellen
 */
function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [measurement, setMeasurement] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  /**
   * Laad meetgegevens bij component mount
   */
  useEffect(() => {
    loadMeasurement();
  }, [id]);

  /**
   * Laad meting van de API
   */
  const loadMeasurement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMeasurementById(id);
      setMeasurement(data.series);
      setDataPoints(data.dataPoints);
      setStatistics(data.statistics);
    } catch (err) {
      console.error('Fout bij laden meting:', err);
      setError('Kon meting niet laden');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !measurement) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            {error || 'Meting niet gevonden'}
          </div>
          <button onClick={() => navigate('/overview')} className="btn btn-primary">
            Terug naar overzicht
          </button>
        </div>
      </div>
    );
  }

  // Paginering voor tabel
  const totalPages = Math.ceil(dataPoints.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = dataPoints.slice(startIndex, endIndex);

  return (
    <div className="container">
      {/* Header met info */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2>📊 {measurement.location}</h2>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>
              Upload: {formatDate(measurement.upload_date)} | 
              Meetpunten: {measurement.data_point_count.toLocaleString()}
            </p>
          </div>
          <button onClick={() => navigate('/overview')} className="btn btn-secondary">
            ← Terug
          </button>
        </div>
      </div>

      {/* Statistieken */}
      {statistics && (
        <div className="card">
          <h3>📈 Statistieken</h3>
          <div className="grid grid-4" style={{ marginTop: '1rem' }}>
            {/* PM1.0 */}
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#3498db' }}>PM1.0</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Gem:</strong> {formatNumber(statistics.avg_pm1_0)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Max:</strong> {formatNumber(statistics.max_pm1_0)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Min:</strong> {formatNumber(statistics.min_pm1_0)} µg/m³
              </p>
            </div>

            {/* PM2.5 */}
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ecc71' }}>PM2.5</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Gem:</strong> {formatNumber(statistics.avg_pm2_5)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Max:</strong> {formatNumber(statistics.max_pm2_5)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Min:</strong> {formatNumber(statistics.min_pm2_5)} µg/m³
              </p>
            </div>

            {/* PM4.0 */}
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#f39c12' }}>PM4.0</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Gem:</strong> {formatNumber(statistics.avg_pm4_0)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Max:</strong> {formatNumber(statistics.max_pm4_0)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Min:</strong> {formatNumber(statistics.min_pm4_0)} µg/m³
              </p>
            </div>

            {/* PM10 */}
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#e74c3c' }}>PM10</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Gem:</strong> {formatNumber(statistics.avg_pm10)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Max:</strong> {formatNumber(statistics.max_pm10)} µg/m³
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                <strong>Min:</strong> {formatNumber(statistics.min_pm10)} µg/m³
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grafieken */}
      <div className="card">
        <h3>📈 Grafieken</h3>
        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          <PMChart 
            data={dataPoints} 
            pmType="pm1_0" 
            color="#3498db" 
            title="PM1.0 (µg/m³)" 
          />
          <PMChart 
            data={dataPoints} 
            pmType="pm2_5" 
            color="#2ecc71" 
            title="PM2.5 (µg/m³)" 
          />
          <PMChart 
            data={dataPoints} 
            pmType="pm4_0" 
            color="#f39c12" 
            title="PM4.0 (µg/m³)" 
          />
          <PMChart 
            data={dataPoints} 
            pmType="pm10" 
            color="#e74c3c" 
            title="PM10 (µg/m³)" 
          />
        </div>
      </div>

      {/* Data tabel */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📋 Meetgegevens</h3>
          <button 
            onClick={() => setShowTable(!showTable)} 
            className="btn btn-secondary"
          >
            {showTable ? '▲ Verberg tabel' : '▼ Toon tabel'}
          </button>
        </div>

        {showTable && (
          <>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>🕐 Datum/Tijd</th>
                    <th>PM1.0</th>
                    <th>PM2.5</th>
                    <th>PM4.0</th>
                    <th>PM10</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.map((point, index) => (
                    <tr key={point.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{point.datetime_local}</td>
                      <td>{formatNumber(point.pm1_0)} µg/m³</td>
                      <td>{formatNumber(point.pm2_5)} µg/m³</td>
                      <td>{formatNumber(point.pm4_0)} µg/m³</td>
                      <td>{formatNumber(point.pm10)} µg/m³</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginering */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  ← Vorige
                </button>
                <span>
                  Pagina {currentPage} van {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DetailPage;
