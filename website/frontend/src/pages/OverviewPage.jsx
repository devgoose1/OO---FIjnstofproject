import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMeasurements, deleteMeasurement } from '../services/api';
import { formatDate } from '../utils/formatters';

/**
 * Overzichtspagina component
 * Toont alle meetseries in een tabel
 */
function OverviewPage() {
  const navigate = useNavigate();
  
  // State
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  /**
   * Laad alle metingen bij component mount
   */
  useEffect(() => {
    loadMeasurements();
  }, []);

  /**
   * Laad metingen van de API
   */
  const loadMeasurements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllMeasurements();
      setMeasurements(data.series || []);
    } catch (err) {
      console.error('Fout bij laden metingen:', err);
      setError('Kon metingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verwijder een meting
   */
  const handleDelete = async (id, location) => {
    if (!window.confirm(`Weet je zeker dat je de meting "${location}" wilt verwijderen?`)) {
      return;
    }

    try {
      await deleteMeasurement(id);
      // Reload metingen
      await loadMeasurements();
    } catch (err) {
      console.error('Fout bij verwijderen:', err);
      alert('Kon meting niet verwijderen');
    }
  };

  /**
   * Filter en sorteer metingen
   */
  const getFilteredAndSortedMeasurements = () => {
    let filtered = measurements;

    // Filter op locatie
    if (filterLocation) {
      filtered = filtered.filter(m => 
        m.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Sorteer
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'location-asc':
          return a.location.localeCompare(b.location);
        case 'location-desc':
          return b.location.localeCompare(a.location);
        case 'count-desc':
          return b.data_point_count - a.data_point_count;
        case 'count-asc':
          return a.data_point_count - b.data_point_count;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredMeasurements = getFilteredAndSortedMeasurements();

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
  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            {error}
          </div>
          <button onClick={loadMeasurements} className="btn btn-primary">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>📊 Meetseries Overzicht</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Totaal {measurements.length} meetserie(s) beschikbaar
        </p>

        {/* Filters en sortering */}
        <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter">🔍 Filter op locatie</label>
            <input
              id="filter"
              type="text"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              placeholder="Zoek op locatie..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="sort">📋 Sorteer op</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Datum (nieuwste eerst)</option>
              <option value="date-asc">Datum (oudste eerst)</option>
              <option value="location-asc">Locatie (A-Z)</option>
              <option value="location-desc">Locatie (Z-A)</option>
              <option value="count-desc">Aantal meetpunten (hoog-laag)</option>
              <option value="count-asc">Aantal meetpunten (laag-hoog)</option>
            </select>
          </div>
        </div>

        {/* Tabel */}
        {filteredMeasurements.length === 0 ? (
          <div className="alert alert-info">
            {filterLocation 
              ? `Geen metingen gevonden met locatie "${filterLocation}"`
              : 'Nog geen metingen beschikbaar. Upload een CSV bestand om te beginnen.'
            }
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>📍 Locatie</th>
                  <th>📅 Upload Datum</th>
                  <th>📊 Meetpunten</th>
                  <th>🔧 Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeasurements.map((measurement) => (
                  <tr key={measurement.id}>
                    <td>#{measurement.id}</td>
                    <td>
                      <strong>{measurement.location}</strong>
                    </td>
                    <td>{formatDate(measurement.upload_date)}</td>
                    <td>{measurement.data_point_count.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/detail/${measurement.id}`)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        >
                          📈 Bekijken
                        </button>
                        <button
                          onClick={() => handleDelete(measurement.id, measurement.location)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snelle acties */}
      <div className="grid grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>📤 Nieuwe meting</h3>
          <p style={{ color: '#666', margin: '1rem 0' }}>
            Upload een nieuw CSV bestand
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Upload CSV
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3>🔄 Vergelijken</h3>
          <p style={{ color: '#666', margin: '1rem 0' }}>
            Vergelijk meerdere metingen
          </p>
          <button
            onClick={() => navigate('/compare')}
            className="btn btn-secondary"
          >
            Vergelijkingspagina
          </button>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
