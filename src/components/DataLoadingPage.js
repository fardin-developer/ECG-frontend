// components/DataLoadingPage.jsx
'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FileText, Upload } from 'lucide-react';

export default function DataLoadingPage() {
  const [loadedData, setLoadedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState(null);

  // Handle an uploaded CSV/TXT file
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter((line) => line.trim());

        // Detect header row (if first line contains "time", "Time", or "t")
        const startIndex =
          lines[0].includes('time') ||
          lines[0].includes('Time') ||
          lines[0].includes('t')
            ? 1
            : 0;

        const data = lines
          .slice(startIndex)
          .map((line, index) => {
            const parts = line.split(/[,\t\s]+/);
            if (parts.length >= 2) {
              // If the CSV/TXT has more than two columns, only first two are used
              const time = parseFloat(parts[0]) || index * 0.004;
              const value = parseFloat(parts[1]) || 0;
              return {
                time: parseFloat(time.toFixed(3)),
                value: parseFloat(value.toFixed(3)),
              };
            }
            return null;
          })
          .filter((item) => item !== null);

        if (data.length > 0) {
          setLoadedData(data);

          // Calculate statistics
          const values = data.map((d) => d.value);
          const stats = {
            duration: data[data.length - 1].time.toFixed(1),
            samples: data.length,
            sampleRate: Math.round(
              data.length / data[data.length - 1].time
            ),
            min: Math.min(...values).toFixed(3),
            max: Math.max(...values).toFixed(3),
            mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
          };
          setDataStats(stats);
        } else {
          alert('No valid data found in file. Please check the format.');
          setLoadedData([]);
          setDataStats(null);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please ensure it contains time and value columns.');
        setLoadedData([]);
        setDataStats(null);
      }
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  // Export loadedData as CSV
  const exportData = () => {
    if (loadedData.length === 0) return;

    const csvContent = 'time,value\n' + loadedData.map((d) => `${d.time},${d.value}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^/.]+$/, '') + '_processed.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setLoadedData([]);
    setFileName('');
    setDataStats(null);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg h-screen shadow-md w-full flex justify-center items-center flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 w-full max-w-3xl">
        <div className="flex items-center">
          <FileText className="text-green-500 mr-2" size={24} />
          <h1 className="text-xl font-bold text-gray-800">ECG Data Loader & Analyzer</h1>
        </div>
        {fileName && (
          <div className="text-sm text-gray-600 truncate max-w-xs">
            📁 {fileName}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-md shadow-sm mb-4 w-full max-w-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Upload className="mr-2" size={20} />
          Load ECG Data
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV/TXT File
            </label>
            <input
              type="file"
              accept=".csv,.txt,.dat"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="block w-full text-sm text-gray-500 
                         file:mr-4 file:py-2 file:px-4 file:rounded-md 
                         file:border-0 file:text-sm file:font-semibold 
                         file:bg-blue-50 file:text-blue-700 
                         hover:file:bg-blue-100 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: CSV, TXT with time,value columns (comma/tab/space separated)
            </p>
          </div>
        </div>
      </div>

      {/* Data Stats */}
      {dataStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 w-full max-w-3xl">
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-lg font-bold text-blue-600">{dataStats.duration}s</div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Samples</div>
            <div className="text-lg font-bold text-purple-600">{dataStats.samples.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Sample Rate</div>
            <div className="text-lg font-bold text-green-600">{dataStats.sampleRate}Hz</div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Min Value</div>
            <div className="text-lg font-bold text-red-600">{dataStats.min}mV</div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Max Value</div>
            <div className="text-lg font-bold text-red-600">{dataStats.max}mV</div>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm text-center">
            <div className="text-xs text-gray-500">Mean</div>
            <div className="text-lg font-bold text-orange-600">{dataStats.mean}mV</div>
          </div>
        </div>
      )}

      {/* Chart */}
      {loadedData.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow-sm h-80 mb-4 w-full max-w-3xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">ECG Signal Visualization</h3>
            <div className="text-sm text-gray-500">Showing {loadedData.length} data points</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loadedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="time"
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Amplitude (mV)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [value + ' mV', 'ECG Signal']}
                labelFormatter={(time) => `Time: ${time}s`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls (only appear when data is loaded) */}
      {loadedData.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-between w-full max-w-3xl">
          <div className="flex gap-2">
            <button
              onClick={clearData}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Clear Data
            </button>
            <button
              onClick={exportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Export CSV
            </button>
          </div>
          <div className="flex gap-2">
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md">
              Peak Detection
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
              Heart Rate Analysis
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {loadedData.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-500 w-full max-w-3xl">
          <Upload size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No ECG Data Loaded</h3>
          <p className="text-sm">Upload a CSV or TXT file with time,value columns to get started.</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Expected format:</p>
            <p><code>time,value</code> (comma, tab, or space separated)</p>
            <p>Example:</p>
            <p><code>0.000,0.123</code></p>
          </div>
        </div>
      )}
    </div>
  );
}
