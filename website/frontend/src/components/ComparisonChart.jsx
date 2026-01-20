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
 * Vergelijkingsgrafiek component
 * Toont meerdere series in één grafiek
 * @param {Object} seriesData - Data per serie { seriesId: dataPoints[] }
 * @param {Array} seriesInfo - Info over series [{ id, location, color }]
 * @param {string} pmType - Type PM (pm1_0, pm2_5, pm4_0, pm10)
 * @param {string} title - Grafiek titel
 */
function ComparisonChart({ seriesData, seriesInfo, pmType, title }) {
  // Transformeer data voor Recharts
  // We moeten alle series combineren op basis van tijd/index
  const allData = [];
  
  // Verzamel alle unieke tijdstippen
  Object.keys(seriesData).forEach(seriesId => {
    const points = seriesData[seriesId];
    points.forEach((point, index) => {
      const existingPoint = allData.find(d => d.index === index);
      if (existingPoint) {
        existingPoint[`serie_${seriesId}`] = point[pmType];
      } else {
        allData.push({
          index: index,
          tijd: point.datetime_local,
          [`serie_${seriesId}`]: point[pmType]
        });
      }
    });
  });

  // Sorteer op index
  allData.sort((a, b) => a.index - b.index);

  const tickInterval = Math.ceil(allData.length / 10);

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={allData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index" 
            interval={tickInterval}
            label={{ value: 'Meetpunt', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
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
                    borderRadius: '4px',
                    maxWidth: '250px'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', marginBottom: '4px' }}>
                      <strong>Meetpunt:</strong> {payload[0].payload.index}
                    </p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ 
                        margin: '2px 0', 
                        fontSize: '0.9rem', 
                        color: entry.color 
                      }}>
                        <strong>{entry.name}:</strong> {entry.value?.toFixed(2)} µg/m³
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          {seriesInfo.map(series => (
            <Line
              key={series.id}
              type="monotone"
              dataKey={`serie_${series.id}`}
              stroke={series.color}
              name={series.location}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ComparisonChart;
