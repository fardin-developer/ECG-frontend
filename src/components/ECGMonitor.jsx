'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Clock, Battery, Wifi } from 'lucide-react';

const ECGMonitor = () => {
  const [ecgData, setEcgData] = useState([]);
  const [connected, setConnected] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [batteryLevel, setBatteryLevel] = useState(85);

  // Generate mock ECG data
  useEffect(() => {
    // Simulate ECG waveform with P wave, QRS complex, and T wave
    const generateECGPoint = (index) => {
      const baseValue = 0.8;
      const time = index * 0.02; // 20ms per sample
      
      // P wave
      const pWave = Math.sin(time * 10) * 0.1;
      
      // QRS complex
      const qrs = index % 50 === 25 ? -0.3 : 
                 index % 50 === 26 ? -0.2 : 
                 index % 50 === 27 ? 1.2 : 
                 index % 50 === 28 ? 0.6 : 
                 index % 50 === 29 ? 0.2 : 0;
      
      // T wave
      const tWave = index % 50 >= 35 && index % 50 <= 45 ? 
                    Math.sin((index % 50 - 35) * 0.3) * 0.2 : 0;
      
      // Combine all components
      const value = baseValue + pWave + qrs + tWave;
      
      // Add some noise
      const noise = Math.random() * 0.05 - 0.025;
      
      return {
        time: time.toFixed(2),
        value: value + noise
      };
    };
    
    // Generate initial data
    const initialData = Array.from({ length: 100 }, (_, i) => generateECGPoint(i));
    setEcgData(initialData);
    
    // Update data periodically
    const interval = setInterval(() => {
      setEcgData(prevData => {
        const newData = [...prevData.slice(1), generateECGPoint(prevData.length + 1)];
        return newData;
      });
      
      // Randomly update heart rate slightly
      setHeartRate(prev => Math.floor(prev + (Math.random() * 6 - 3)));
      
      // Slowly decrease battery
      setBatteryLevel(prev => Math.max(prev - 0.1, 0));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

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
            <span className="text-sm">{batteryLevel}%</span>
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
              domain={[0, 2.5]} 
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
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
          Start Recording
        </button>
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
          Export Data
        </button>
      </div>
    </div>
  );
};

export default ECGMonitor;