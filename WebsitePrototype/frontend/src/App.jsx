import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Area,
  AreaChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,  
} from 'recharts'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500'
const CHART_COLORS = ['#0F766E', '#F97316', '#2563EB', '#E11D48', '#059669', '#7C3AED']
const CHART_LABELS = { line: 'Lijn', area: 'Gebied', bar: 'Staaf', pie: 'Taart', scatter: 'Spreiding' }

function App() {
  const [datasets, setDatasets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [chartType, setChartType] = useState('line')
  const [xColumn, setXColumn] = useState('')
  const [yColumn, setYColumn] = useState('')
  const [categoryColumn, setCategoryColumn] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [status, setStatus] = useState('')
  const [datasetName, setDatasetName] = useState('')
  const [compareId, setCompareId] = useState('')
  const [compareRows, setCompareRows] = useState([])
  const [compareColumns, setCompareColumns] = useState([])

  useEffect(() => {
    fetchDatasets()
  }, [])

  useEffect(() => {
    if (columns.length) {
      setXColumn((prev) => prev || columns[0])
      setYColumn((prev) => prev || columns[1] || columns[0])
      setCategoryColumn((prev) => prev || columns[0])
    }
  }, [columns])

  const chartData = useMemo(() => {
    if (!rows.length || !xColumn || !yColumn) return []
    return rows.map((row) => ({
      x: row[xColumn],
      y: toNumber(row[yColumn]),
      ...row,
    }))
  }, [rows, xColumn, yColumn])

  const mergedData = useMemo(() => {
    if (!xColumn || !yColumn) return []
    if (!compareId || !compareRows.length) return chartData
    const map = new Map()
    for (const r of rows) {
      const key = String(r[xColumn])
      map.set(key, { x: r[xColumn], yA: toNumber(r[yColumn]) })
    }
    for (const r of compareRows) {
      const key = String(r[xColumn])
      const existing = map.get(key) || { x: r[xColumn] }
      existing.yB = toNumber(r[yColumn])
      map.set(key, existing)
    }
    return Array.from(map.values())
  }, [rows, compareRows, xColumn, yColumn, compareId, chartData])

  const scatterA = useMemo(() => {
    if (!rows.length || !xColumn || !yColumn) return []
    return rows
      .map((r) => ({ x: toNumber(r[xColumn]), y: toNumber(r[yColumn]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  }, [rows, xColumn, yColumn])

  const scatterB = useMemo(() => {
    if (!compareId || !compareRows.length || !xColumn || !yColumn) return []
    return compareRows
      .map((r) => ({ x: toNumber(r[xColumn]), y: toNumber(r[yColumn]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  }, [compareId, compareRows, xColumn, yColumn])

  const pieData = useMemo(() => {
    if (!rows.length || !categoryColumn || !yColumn) return []
    const totals = new Map()
    for (const row of rows) {
      const key = row[categoryColumn] ?? 'Zonder label'
      const amount = toNumber(row[yColumn])
      totals.set(key, (totals.get(key) || 0) + amount)
    }
    return Array.from(totals.entries()).map(([name, value]) => ({ name, value }))
  }, [rows, categoryColumn, yColumn])

  async function fetchDatasets() {
    try {
      const res = await axios.get(`${API_BASE}/api/datasets`)
      setDatasets(res.data.datasets)
      if (!selectedId && res.data.datasets.length) {
        selectDataset(res.data.datasets[0].id)
      }
    } catch (err) {
      console.error(err)
      setStatus('Kon datasets nog niet laden. Upload een bestand om te beginnen.')
    }
  }

  async function selectDataset(id) {
    setSelectedId(id)
    if (!id) return
    setLoadingData(true)
    try {
      const [metaRes, rowsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/datasets/${id}`),
        axios.get(`${API_BASE}/api/datasets/${id}/rows`),
      ])
      setColumns(metaRes.data.dataset.columnNames || [])
      setRows(rowsRes.data.rows || [])
      setStatus('')
    } catch (err) {
      console.error(err)
      setStatus('Laden van datasetrijen mislukt')
    } finally {
      setLoadingData(false)
    }
  }

  async function selectCompareDataset(id) {
    setCompareId(id)
    if (!id) {
      setCompareRows([])
      setCompareColumns([])
      return
    }
    try {
      const [metaRes, rowsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/datasets/${id}`),
        axios.get(`${API_BASE}/api/datasets/${id}/rows`),
      ])
      setCompareColumns(metaRes.data.dataset.columnNames || [])
      setCompareRows(rowsRes.data.rows || [])
    } catch (err) {
      console.error(err)
      setStatus('Failed to load comparison dataset')
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    if (datasetName.trim()) {
      formData.append('name', datasetName.trim())
    }

    setUploading(true)
    setStatus('CSV uploaden en parseren...')

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newDataset = res.data.dataset
      setDatasets((prev) => [newDataset, ...prev])
      setDatasetName('')
      await selectDataset(newDataset.id)
      setStatus('Upload voltooid. Dataset klaar om te verkennen.')
    } catch (err) {
      console.error(err)
      setStatus('Upload mislukt. Controleer de CSV en probeer opnieuw.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const hasData = rows.length > 0 && columns.length > 0

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">CSV Verkenner</p>
          <h1>Upload, bewaar en visualiseer data zonder gedoe.</h1>
          <p className="lede">
            Importeer CSV's één keer, bewaar ze in je omgeving en wissel tussen grafieken om snel inzichten te krijgen.
          </p>
        </div>
        <div className="upload-card">
          <div className="card-head">
            <div>
              <p className="label">Datasetnaam (optioneel)</p>
              <input
                type="text"
                placeholder="Marketingprestaties, Sensoren, ..."
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </div>
          </div>
          <label className="upload-zone">
            <input type="file" accept=".csv" onChange={handleUpload} disabled={uploading} />
            <div>
              <p className="upload-title">Sleep een CSV hierheen of klik om te uploaden</p>
              <p className="muted">We parseren, bewaren en tonen kolommen automatisch voor grafieken.</p>
            </div>
            <span className="pill">CSV</span>
          </label>
          {status && <p className="status">{status}</p>}
        </div>
      </header>

      <main className="grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Opgeslagen datasets</h2>
            <button className="ghost" onClick={fetchDatasets}>Vernieuwen</button>
          </div>
          {datasets.length === 0 && <p className="muted">Nog geen datasets. Upload een CSV om te beginnen.</p>}
          <div className="dataset-list">
            {datasets.map((ds) => (
              <button
                key={ds.id}
                className={`dataset ${selectedId === ds.id ? 'active' : ''}`}
                onClick={() => selectDataset(ds.id)}
              >
                <div>
                  <p className="dataset-name">{ds.name}</p>
                  <p className="muted">{ds.originalFilename}</p>
                </div>
                <div className="meta">{ds.rowCount} rijen</div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Grafiekinstellingen</h2>
            {loadingData && <span className="badge">Laden...</span>}
          </div>
          {!hasData && <p className="muted">Selecteer een dataset om een grafiek te configureren.</p>}

          {hasData && (
            <div className="controls">
              <div className="field">
                <label>Grafiektype</label>
                <div className="pill-group">
                  {['line', 'area', 'bar', 'pie', 'scatter'].map((type) => (
                    <button
                      key={type}
                      className={`pill-btn ${chartType === type ? 'active' : ''}`}
                      onClick={() => setChartType(type)}
                      type="button"
                    >
                      {CHART_LABELS[type] || type}
                    </button>
                  ))}
                </div>
              </div>

              {(chartType === 'line' || chartType === 'area' || chartType === 'bar') && (
                <div className="control-row">
                  <div className="field">
                    <label>X-as</label>
                    <select value={xColumn} onChange={(e) => setXColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Y-as</label>
                    <select value={yColumn} onChange={(e) => setYColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {chartType === 'scatter' && (
                <div className="control-row">
                  <div className="field">
                    <label>Numeric X</label>
                    <select value={xColumn} onChange={(e) => setXColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Numeric Y</label>
                    <select value={yColumn} onChange={(e) => setYColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="control-row">
                <div className="field">
                  <label>Compare with</label>
                  <select value={compareId} onChange={(e) => selectCompareDataset(e.target.value)}>
                    <option value="">None</option>
                    {datasets
                      .filter((d) => d.id !== selectedId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {chartType === 'pie' && (
                <div className="control-row">
                  <div className="field">
                    <label>Categoriekolom</label>
                    <select value={categoryColumn} onChange={(e) => setCategoryColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Waarde-kolom</label>
                    <select value={yColumn} onChange={(e) => setYColumn(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel chart-panel">
          <div className="panel-head">
            <h2>Visualisatie</h2>
            {selectedId && <span className="muted">Dataset nr. {selectedId}</span>}
          </div>
          {!hasData && <p className="muted">Grafieken verschijnen nadat je een dataset en kolommen kiest.</p>}
          {hasData && (
            <div className="chart-shell">
              {chartType === 'line' && (
                <ResponsiveContainer>
                  <LineChart data={mergedData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="x" label={{ value: xColumn, position: 'insideBottom', offset: -4 }} />
                    <YAxis label={{ value: yColumn, angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={compareId ? 'yA' : 'y'} name={yColumn + (compareId ? ' (A)' : '')} stroke="#2563EB" strokeWidth={2} dot={false} />
                    {compareId && (
                      <Line type="monotone" dataKey="yB" name={`${yColumn} (B)`} stroke="#E11D48" strokeWidth={2} dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartType === 'area' && (
                <ResponsiveContainer>
                  <AreaChart data={mergedData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="x" label={{ value: xColumn, position: 'insideBottom', offset: -4 }} />
                    <YAxis label={{ value: yColumn, angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey={compareId ? 'yA' : 'y'} name={yColumn + (compareId ? ' (A)' : '')} stroke="#2563EB" fill="#93C5FD" />
                    {compareId && (
                      <Area type="monotone" dataKey="yB" name={`${yColumn} (B)`} stroke="#E11D48" fill="#FDA4AF" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartType === 'bar' && (
                <ResponsiveContainer>
                  <BarChart data={mergedData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="x" label={{ value: xColumn, position: 'insideBottom', offset: -4 }} />
                    <YAxis label={{ value: yColumn, angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={compareId ? 'yA' : 'y'} name={yColumn + (compareId ? ' (A)' : '')} fill="#0F766E" radius={4} />
                    {compareId && <Bar dataKey="yB" name={`${yColumn} (B)`} fill="#F97316" radius={4} />}
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'pie' && (
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={130} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'scatter' && (
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="x" name={xColumn} label={{ value: xColumn, position: 'insideBottom', offset: -4 }} />
                    <YAxis type="number" dataKey="y" name={yColumn} label={{ value: yColumn, angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name={`A`} data={scatterA} fill="#2563EB" />
                    {compareId && <Scatter name={`B`} data={scatterB} fill="#E11D48" />}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </section>

        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Gegevensvoorbeeld</h2>
            {hasData && <span className="muted">Eerste 8 rijen</span>}
          </div>
          {!hasData && <p className="muted">Je geüploade gegevens verschijnen hier.</p>}
          {hasData && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={`${idx}-${col}`}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export default App
