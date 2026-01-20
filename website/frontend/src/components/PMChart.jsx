import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Grafiek component voor fijnstof data
 * @param {Array} data - Meetpunt data
 * @param {string} pmType - Type PM (pm1_0, pm2_5, pm4_0, pm10)
 * @param {string} color - Lijn kleur
 * @param {string} title - Grafiek titel
 */
function PMChart({ data, pmType, color, title }) {
  // Transformeer data voor Recharts
  const chartData = data.map((point, index) => ({
    index: index,
    tijd: point.datetime_local,
    waarde: point[pmType]
  }));

  // Sample data voor X-as labels (toon niet alles)
  const tickInterval = Math.ceil(chartData.length / 10);

  // Bepaal dynamische Y-as zodat er weinig lege ruimte is rondom de meetwaarden
  const values = chartData
    .map((p) => Number(p.waarde))
    .filter((v) => Number.isFinite(v));

  const hasValues = values.length > 0;
  const minVal = hasValues ? Math.min(...values) : 0;
  const maxVal = hasValues ? Math.max(...values) : 1;
  const range = Math.max(maxVal - minVal, 0.001);
  const padding = Math.max(range * 0.1, 0.2); // klein beetje marge rond de data
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index" 
            interval={tickInterval}
            label={{ value: 'Meetpunt', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            domain={[yMin, yMax]}
            label={{ value: 'Concentratie (µg/m³)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      <strong>Tijd:</strong> {payload[0].payload.tijd}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: color }}>
                      <strong>Waarde:</strong> {payload[0].value.toFixed(2)} µg/m³
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="waarde" 
            stroke={color} 
            name={title}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PMChart;
