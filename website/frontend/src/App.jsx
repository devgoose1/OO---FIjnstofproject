import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import OverviewPage from './pages/OverviewPage';
import DetailPage from './pages/DetailPage';
import ComparePage from './pages/ComparePage';
import './App.css';

/**
 * Navigatie component
 */
function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <div className="nav-content">
        <h1>🌫️ Fijnstof Analyse</h1>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              📤 Upload
            </Link>
          </li>
          <li>
            <Link to="/overview" className={location.pathname === '/overview' ? 'active' : ''}>
              📊 Overzicht
            </Link>
          </li>
          <li>
            <Link to="/compare" className={location.pathname === '/compare' ? 'active' : ''}>
              🔄 Vergelijken
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

/**
 * Hoofdapplicatie component
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
