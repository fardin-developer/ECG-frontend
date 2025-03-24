'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Clock, Battery, Wifi } from 'lucide-react';

const ECGMonitor = () => {
  const [ecgData, setEcgData] = useState([]);
  const [connected, setConnected] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isPaused, setIsPaused] = useState(false);

  const generateECGValue = (time, RR_interval) => {
    const t = time % RR_interval; // Time within one cardiac cycle
    let value = 0;

    if (t < 0.1) {
      // P wave: smooth atrial depolarization
      value = 0.1 * Math.sin((t / 0.1) * Math.PI);
    } else if (t < 0.16) {
      // PR segment: flat baseline
      value = 0;
    } else if (t < 0.24) {
      // QRS complex with sharp R point
      if (t < 0.18) {
        // Q wave: small dip
        value = 0 + (-0.2 - 0) * (t - 0.16) / (0.18 - 0.16);
      } else if (t < 0.20) {
        // R wave: steep rise to peak
        value = -0.2 + (1.5 - (-0.2)) * (t - 0.18) / (0.20 - 0.18);
      } else if (t < 0.22) {
        // R wave: steep fall to S wave
        value = 1.5 + (-0.3 - 1.5) * (t - 0.20) / (0.22 - 0.20);
      } else {
        // S wave: return to baseline
        value = -0.3 + (0 - (-0.3)) * (t - 0.22) / (0.24 - 0.22);
      }
    } else if (t < 0.38) {
      // ST segment: slight elevation
      value = 0.05;
    } else if (t < 0.6) {
      // T wave: smooth ventricular repolarization
      value = 0.2 * Math.sin(((t - 0.38) / 0.22) * Math.PI);
    } else {
      // Baseline
      value = 0;
    }

    // Add subtle noise for realism
    const noise = Math.random() * 0.05 - 0.025;
    return value + noise;
  };

  useEffect(() => {
    const RR_interval = 60 / heartRate; // 0.833s for 72 BPM
    const sampleInterval = 0.02; // 20ms per sample

    // Generate initial 2 seconds of data
    const initialData = Array.from({ length: 100 }, (_, i) => {
      const time = i * sampleInterval;
      const value = generateECGValue(time, RR_interval);
      return { time: time.toFixed(2), value };
    });
    setEcgData(initialData);

    // Update data every 100ms
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
  }, [isPaused]);

  return (
    <div className="flex flex-col bg-gray-50 p-4 rounded-lg shadow-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Activity className="text-blue-500 mr-2" size={24} />
          <h1 className="text-xl font-bold text-gray-800">ECG Monitor</h1>
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

export default ECGMonitor;