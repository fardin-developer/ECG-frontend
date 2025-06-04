'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Clock, Battery, Wifi, Upload, FileText, Menu, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA97dwMav-7elz1WRMO33hRjxxUFPGrRGI",
  authDomain: "ecg-proj-45999.firebaseapp.com",
  databaseURL: "https://ecg-proj-45999-default-rtdb.firebaseio.com",
  projectId: "ecg-proj-45999",
  storageBucket: "ecg-proj-45999.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only once
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Real-time ECG Monitor Component
const ECGMonitor = () => {
  const [ecgData, setEcgData] = useState([]);
  const [connected, setConnected] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const ecgRef = ref(database, '/test/ecg');
    const statusRef = ref(database, '/test/status');

    const unsubscribeEcg = onValue(ecgRef, (snapshot) => {
      const value = snapshot.val();
      console.log('📡 Realtime ECG:', value);
    });

    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      console.log('🩺 Lead Status:', status);
    });

    return () => {
      unsubscribeEcg();
      unsubscribeStatus();
    };
  }, []);

  const generateECGValue = (time, RR_interval) => {
    const t = time % RR_interval;
    let value = 0;

    if (t < 0.1) {
      value = 0.1 * Math.sin((t / 0.1) * Math.PI);
    } else if (t < 0.16) {
      value = 0;
    } else if (t < 0.24) {
      if (t < 0.18) {
        value = 0 + (-0.2 - 0) * (t - 0.16) / (0.18 - 0.16);
      } else if (t < 0.20) {
        value = -0.2 + (1.5 - (-0.2)) * (t - 0.18) / (0.20 - 0.18);
      } else if (t < 0.22) {
        value = 1.5 + (-0.3 - 1.5) * (t - 0.20) / (0.22 - 0.20);
      } else {
        value = -0.3 + (0 - (-0.3)) * (t - 0.22) / (0.24 - 0.22);
      }
    } else if (t < 0.38) {
      value = 0.05;
    } else if (t < 0.6) {
      value = 0.2 * Math.sin(((t - 0.38) / 0.22) * Math.PI);
    } else {
      value = 0;
    }

    const noise = Math.random() * 0.05 - 0.025;
    return value + noise;
  };

  useEffect(() => {
    const RR_interval = 60 / heartRate;
    const sampleInterval = 0.02;

    const initialData = Array.from({ length: 100 }, (_, i) => {
      const time = i * sampleInterval;
      const value = generateECGValue(time, RR_interval);
      return { time: time.toFixed(2), value };
    });
    setEcgData(initialData);

    const interval = setInterval(() => {
      if (!isPaused) {
        setEcgData(prevData => {
          const lastTime = parseFloat(prevData[prevData.length - 1].time);
          const newTime = lastTime + sampleInterval;
          const newValue = generateECGValue(newTime, RR_interval);
          const newPoint = { time: newTime.toFixed(2), value: newValue };
          return [...prevData.slice(1), newPoint];
        });
        setBatteryLevel(prev => Math.max(prev - 0.1, 0));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, heartRate]);

  return (
    <div className="flex flex-col bg-gray-50 p-4 rounded-lg shadow-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Activity className="text-blue-500 mr-2" size={24} />
          <h1 className="text-xl font-bold text-gray-800">Real-time ECG Monitor</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-green-500">
            <Wifi size={16} className="mr-1" />
            <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center text-amber-500">
            <Battery size={16} className="mr-1" />
            <span className="text-sm">{batteryLevel.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-md shadow-sm flex items-center">
          <Heart className="text-red-500 mr-2" size={20} />
          <div>
            <div className="text-xs text-gray-500">Heart Rate</div>
            <div className="text-xl font-bold">{heartRate} <span className="text-sm font-normal">BPM</span></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm flex items-center">
          <Clock className="text-blue-500 mr-2" size={20} />
          <div>
            <div className="text-xs text-gray-500">Sample Rate</div>
            <div className="text-xl font-bold">50 <span className="text-sm font-normal">Hz</span></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm flex items-center">
          <Activity className="text-purple-500 mr-2" size={20} />
          <div>
            <div className="text-xs text-gray-500">Signal Quality</div>
            <div className="text-xl font-bold">Good</div>
          </div>
        </div>
      </div>

      {/* ECG Chart */}
      <div className="bg-white p-4 rounded-md shadow-sm h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ecgData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              domain={[-0.5, 1.5]}
              label={{ value: 'Amplitude (mV)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={(value) => [value.toFixed(2) + ' mV', 'ECG']} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="flex justify-between">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
          Export Data
        </button>
      </div>
    </div>
  );
};

// Data Loading Page Component
const DataLoadingPage = () => {
  const [loadedData, setLoadedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState(null);

  const generateSampleData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const sampleData = Array.from({ length: 1000 }, (_, i) => {
        const time = i * 0.004; // 250 Hz sampling rate
        const heartRate = 78;
        const RR_interval = 60 / heartRate;
        const t = time % RR_interval;
        let value = 0;

        // Generate realistic ECG waveform
        if (t < 0.08) {
          // P wave
          value = 0.12 * Math.sin((t / 0.08) * Math.PI);
        } else if (t < 0.12) {
          // PR segment
          value = 0.02;
        } else if (t < 0.20) {
          // QRS complex
          if (t < 0.14) {
            // Q wave
            value = 0.02 + (-0.15 - 0.02) * (t - 0.12) / (0.14 - 0.12);
          } else if (t < 0.16) {
            // R wave
            value = -0.15 + (1.2 - (-0.15)) * (t - 0.14) / (0.16 - 0.14);
          } else if (t < 0.18) {
            // S wave
            value = 1.2 + (-0.25 - 1.2) * (t - 0.16) / (0.18 - 0.16);
          } else {
            // Return to baseline
            value = -0.25 + (0.02 - (-0.25)) * (t - 0.18) / (0.20 - 0.18);
          }
        } else if (t < 0.32) {
          // ST segment
          value = 0.02;
        } else if (t < 0.52) {
          // T wave
          value = 0.02 + 0.18 * Math.sin(((t - 0.32) / 0.20) * Math.PI);
        } else {
          // Baseline
          value = 0.02;
        }

        // Add realistic noise
        const noise = Math.random() * 0.02 - 0.01;
        return { 
          time: parseFloat(time.toFixed(3)), 
          value: parseFloat((value + noise).toFixed(3)) 
        };
      });

      setLoadedData(sampleData);
      setFileName('sample_ecg_data.csv');
      
      // Calculate stats
      const values = sampleData.map(d => d.value);
      const stats = {
        duration: sampleData[sampleData.length - 1].time.toFixed(1),
        samples: sampleData.length,
        sampleRate: Math.round(sampleData.length / sampleData[sampleData.length - 1].time),
        min: Math.min(...values).toFixed(3),
        max: Math.max(...values).toFixed(3),
        mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3)
      };
      setDataStats(stats);
      setIsLoading(false);
    }, 1000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].includes('time') || lines[0].includes('Time') || lines[0].includes('t') ? 1 : 0;
        
        const data = lines.slice(startIndex).map((line, index) => {
          const parts = line.split(/[,\t\s]+/); // Split by comma, tab, or space
          if (parts.length >= 2) {
            const time = parseFloat(parts[0]) || (index * 0.004); // Default 250Hz if no time
            const value = parseFloat(parts[1]) || 0;
            return { 
              time: parseFloat(time.toFixed(3)), 
              value: parseFloat(value.toFixed(3)) 
            };
          }
          return null;
        }).filter(item => item !== null);

        if (data.length > 0) {
          setLoadedData(data);
          
          // Calculate stats
          const values = data.map(d => d.value);
          const stats = {
            duration: data[data.length - 1].time.toFixed(1),
            samples: data.length,
            sampleRate: Math.round(data.length / data[data.length - 1].time),
            min: Math.min(...values).toFixed(3),
            max: Math.max(...values).toFixed(3),
            mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3)
          };
          setDataStats(stats);
        } else {
          alert('No valid data found in file. Please check the format.');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please ensure it contains time and value columns.');
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    if (loadedData.length === 0) return;
    
    const csvContent = "time,value\n" + loadedData.map(d => `${d.time},${d.value}`).join('\n');
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
    <div className="flex flex-col bg-gray-50 p-4 rounded-lg shadow-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
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
      <div className="bg-white p-6 rounded-md shadow-sm mb-4">
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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: CSV, TXT with time,value columns (comma/tab/space separated)
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <button
              onClick={generateSampleData}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Activity className="mr-2" size={16} />
              )}
              {isLoading ? 'Loading...' : 'Generate Sample'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Stats */}
      {dataStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
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
        <div className="bg-white p-4 rounded-md shadow-sm h-80 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">ECG Signal Visualization</h3>
            <div className="text-sm text-gray-500">
              Showing {loadedData.length} data points
            </div>
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

      {/* Controls */}
      {loadedData.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-between">
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
        <div className="text-center py-16 text-gray-500">
          <Upload size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No ECG Data Loaded</h3>
          <p className="text-sm">Upload a CSV file with ECG data or generate sample data to get started.</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Expected format: time,value</p>
            <p>Example: 0.000,0.123</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component with Navigation
const ECGApp = () => {
  const [currentPage, setCurrentPage] = useState('monitor');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'monitor', name: 'Live Monitor', icon: Activity },
    { id: 'data', name: 'Data Loader', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className="text-red-500 mr-3" size={28} />
              <div>
                <span className="text-xl font-bold text-gray-800">ECG Analysis Suite</span>
                <div className="text-xs text-gray-500">Professional ECG Monitoring & Analysis</div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      currentPage === item.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center px-3 py-2 text-base font-medium transition-colors duration-200 ${
                      currentPage === item.id
                        ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} className="mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentPage === 'monitor' && <ECGMonitor />}
        {currentPage === 'data' && <DataLoadingPage />}
      </main>
    </div>
  );
};

export default ECGApp;