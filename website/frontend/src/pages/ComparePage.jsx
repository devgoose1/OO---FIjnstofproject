import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMeasurements, compareMeasurements } from '../services/api';
import { formatDate } from '../utils/formatters';
import ComparisonChart from '../components/ComparisonChart';

/**
 * Vergelijkingspagina component
 * Vergelijk meerdere meetseries met elkaar
 */
function ComparePage() {
  const navigate = useNavigate();

  // State
  const [allMeasurements, setAllMeasurements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Kleuren voor grafieken
  const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

  /**
   * Laad alle metingen bij component mount
   */
  useEffect(() => {
    loadAllMeasurements();
  }, []);

  /**
   * Laad alle metingen
   */
  const loadAllMeasurements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllMeasurements();
      setAllMeasurements(data.series || []);
    } catch (err) {
      console.error('Fout bij laden metingen:', err);
      setError('Kon metingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle selectie van een meting
   */
  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 6) {
        alert('Je kunt maximaal 6 metingen tegelijk vergelijken');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  /**
   * Vergelijk geselecteerde metingen
   */
  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      alert('Selecteer minimaal 2 metingen om te vergelijken');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const data = await compareMeasurements(selectedIds);
      setComparisonData(data);
    } catch (err) {
      console.error('Fout bij vergelijken:', err);
      setError('Kon metingen niet vergelijken');
    } finally {
      setComparing(false);
    }
  };

  /**
   * Reset vergelijking
   */
  const handleReset = () => {
    setSelectedIds([]);
    setComparisonData(null);
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

  // Geen metingen beschikbaar
  if (allMeasurements.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <h2>🔄 Metingen Vergelijken</h2>
          <div className="alert alert-info">
            Geen metingen beschikbaar om te vergelijken. Upload eerst enkele CSV bestanden.
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            📤 Upload CSV
          </button>
        </div>
      </div>
    );
  }

  // Maak seriesInfo array voor grafieken
  const seriesInfo = comparisonData ? comparisonData.series.map((series, index) => ({
    id: series.id,
    location: series.location,
    color: colors[index % colors.length]
  })) : [];

  return (
    <div className="container">
      <div className="card">
        <h2>🔄 Metingen Vergelijken</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Selecteer meerdere metingen om ze met elkaar te vergelijken
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Selectie tabel */}
        <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>✓</th>
                <th>ID</th>
                <th>📍 Locatie</th>
                <th>📅 Datum</th>
                <th>📊 Meetpunten</th>
              </tr>
            </thead>
            <tbody>
              {allMeasurements.map((measurement) => (
                <tr 
                  key={measurement.id}
                  onClick={() => toggleSelection(measurement.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(measurement.id)}
                      onChange={() => toggleSelection(measurement.id)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </td>
                  <td>#{measurement.id}</td>
                  <td>
                    <strong>{measurement.location}</strong>
                  </td>
                  <td>{formatDate(measurement.upload_date)}</td>
                  <td>{measurement.data_point_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actie knoppen */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || comparing}
            className="btn btn-primary"
          >
            {comparing ? (
              <>
                <span className="spinner" style={{ 
                  width: '16px', 
                  height: '16px', 
                  display: 'inline-block',
                  marginRight: '8px',
                  borderWidth: '2px'
                }}></span>
                Vergelijken...
              </>
            ) : (
              `📊 Vergelijk (${selectedIds.length} geselecteerd)`
            )}
          </button>
          
          {(selectedIds.length > 0 || comparisonData) && (
            <button onClick={handleReset} className="btn btn-secondary">
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* Vergelijkingsresultaten */}
      {comparisonData && (
        <>
          {/* Geselecteerde series info */}
          <div className="card">
            <h3>📋 Geselecteerde Metingen</h3>
            <div className="grid grid-3" style={{ marginTop: '1rem' }}>
              {comparisonData.series.map((series, index) => (
                <div 
                  key={series.id}
                  style={{
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${colors[index % colors.length]}`
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', color: colors[index % colors.length] }}>
                    #{series.id} - {series.location}
                  </h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Datum:</strong> {formatDate(series.upload_date)}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>Meetpunten:</strong> {series.data_point_count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vergelijkingsgrafieken */}
          <div className="card">
            <h3>📈 Vergelijkingsgrafieken</h3>
            <div className="grid grid-2" style={{ marginTop: '1rem' }}>
              <ComparisonChart
                seriesData={comparisonData.dataPoints}
                seriesInfo={seriesInfo}
                pmType="pm1_0"
                title="PM1.0 Vergelijking (µg/m³)"
              />
              <ComparisonChart
                seriesData={comparisonData.dataPoints}
                seriesInfo={seriesInfo}
                pmType="pm2_5"
                title="PM2.5 Vergelijking (µg/m³)"
              />
              <ComparisonChart
                seriesData={comparisonData.dataPoints}
                seriesInfo={seriesInfo}
                pmType="pm4_0"
                title="PM4.0 Vergelijking (µg/m³)"
              />
              <ComparisonChart
                seriesData={comparisonData.dataPoints}
                seriesInfo={seriesInfo}
                pmType="pm10"
                title="PM10 Vergelijking (µg/m³)"
              />
            </div>
          </div>

          {/* Tips voor interpretatie */}
          <div className="card">
            <h3>💡 Interpretatie Tips</h3>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Vergelijk de algemene trends tussen verschillende locaties</li>
              <li>Let op piekmomenten - komen die overeen tussen metingen?</li>
              <li>Kleurverschillen in de grafiek helpen bij het onderscheiden van series</li>
              <li>Hover over de grafiek voor exacte waarden op specifieke momenten</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default ComparePage;
