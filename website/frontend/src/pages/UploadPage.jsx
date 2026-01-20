import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMeasurement } from '../services/api';

/**
 * Upload pagina component
 * Gebruiker kan CSV uploaden met locatie invoer
 */
function UploadPage() {
  const navigate = useNavigate();
  
  // State
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  /**
   * Handle bestand selectie via input
   */
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Alleen CSV bestanden zijn toegestaan');
        setFile(null);
      }
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Alleen CSV bestanden zijn toegestaan');
    }
  };

  /**
   * Handle formulier submit
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validatie
    if (!file) {
      setError('Selecteer een CSV bestand');
      return;
    }
    
    if (!location.trim()) {
      setError('Vul een locatie in');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload naar backend
      const result = await uploadMeasurement(file, location);
      
      setSuccess(`Upload succesvol! ${result.dataPointCount} meetpunten opgeslagen.`);
      
      // Reset formulier
      setFile(null);
      setLocation('');
      
      // Navigeer na 2 seconden naar overzicht
      setTimeout(() => {
        navigate('/overview');
      }, 2000);

    } catch (err) {
      console.error('Upload fout:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.details || 
        'Er is een fout opgetreden bij het uploaden'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>📤 CSV Upload</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Upload een fijnstof CSV bestand met metingen. Het bestand moet puntkomma's (;) als 
          scheidingsteken gebruiken.
        </p>

        {/* Foutmelding */}
        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        {/* Succesmelding */}
        {success && (
          <div className="alert alert-success">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Locatie invoer */}
          <div className="form-group">
            <label htmlFor="location">
              📍 Locatie *
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bijv. Utrecht - Balkon"
              disabled={uploading}
              required
            />
            <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
              Waar is deze meting uitgevoerd?
            </small>
          </div>

          {/* Bestand upload */}
          <div className="form-group">
            <label>📄 CSV Bestand *</label>
            
            {/* Drag and drop area */}
            <div
              className={`file-upload ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              {file ? (
                <div>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
                  <p style={{ fontWeight: 'bold' }}>{file.name}</p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p style={{ color: '#3498db', marginTop: '1rem', fontSize: '0.9rem' }}>
                    Klik om een ander bestand te selecteren
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📁</p>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Sleep een CSV bestand hierheen
                  </p>
                  <p style={{ color: '#666' }}>of klik om een bestand te selecteren</p>
                </div>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>

          {/* CSV formaat info */}
          <div className="alert alert-info">
            <strong>📋 CSV Formaat:</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <li>Scheidingsteken: puntkomma (;)</li>
              <li>Kolommen: tijd s, pm 1.0 ug/m3, pm 2.5 ug/m3, pm 4.0 ug/m3, pm 10 ug/m3</li>
              <li>tijd s: Unix timestamp in seconden</li>
            </ul>
          </div>

          {/* Submit knop */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={uploading || !file || !location.trim()}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {uploading ? (
              <>
                <span className="spinner" style={{ 
                  width: '16px', 
                  height: '16px', 
                  display: 'inline-block',
                  marginRight: '8px',
                  borderWidth: '2px'
                }}></span>
                Uploaden...
              </>
            ) : (
              '🚀 Upload en Analyseer'
            )}
          </button>
        </form>
      </div>

      {/* Extra info card */}
      <div className="card">
        <h3>💡 Tips</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Zorg dat je CSV bestand het juiste formaat heeft</li>
          <li>De tijdstempels worden automatisch geconverteerd naar Europe/Amsterdam tijdzone</li>
          <li>Na upload kun je de data bekijken in het overzicht</li>
          <li>Je kunt meerdere metingen vergelijken op de vergelijkingspagina</li>
        </ul>
      </div>
    </div>
  );
}

export default UploadPage;
