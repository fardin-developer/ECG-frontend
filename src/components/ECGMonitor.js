// components/ECGMonitor.jsx
'use client';

import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Activity, Heart, Clock, Battery, Wifi } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyA97dwMav-7elz1WRMO33hRjxxUFPGrRGI",
  authDomain: "ecg-proj-45999.firebaseapp.com",
  databaseURL: "https://ecg-proj-45999-default-rtdb.firebaseio.com",
  projectId: "ecg-proj-45999",
  storageBucket: "ecg-proj-45999.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (only once)
const firebaseApp = initializeApp(firebaseConfig)
const database = getDatabase(firebaseApp)

export default function ECGMonitor() {
  const [ecgData, setEcgData] = useState([])
  const [connected, setConnected] = useState(true)
  const [heartRate, setHeartRate] = useState(72)
  const [displayHeartRate, setDisplayHeartRate] = useState(72)
  const [batteryLevel, setBatteryLevel] = useState(85)
  const [isPaused, setIsPaused] = useState(false)
  const [graphMode, setGraphMode] = useState(0) // 0: baseline, 1: ECG1, 2: ECG2, 3: less noise, 4: more noise
  const [currentEcgValue, setCurrentEcgValue] = useState(0) // For real-time Firebase ECG data
  const [globalTime, setGlobalTime] = useState(0) // Track continuous time

  // Calculate heart rate from ECG data and update display heart rate
  // Subscribe to real‐time Firebase values (ECG & status)
  useEffect(() => {
    if (graphMode === 1 || graphMode === 2) {
      // For normal ECG signals, calculate heart rate from the actual waveform
      const RR_interval = 60 / heartRate // Base RR interval
      
      // Simulate realistic heart rate detection with some variation
      const detectedHeartRate = Math.round(heartRate + (Math.random() - 0.5) * 4) // ±2 BPM variation
      setDisplayHeartRate(Math.max(45, Math.min(150, detectedHeartRate))) // Clamp between 45-150 BPM
      
    } else if (graphMode === 3) {
      // For light noise, occasionally show "measuring" or slightly inaccurate readings
      if (Math.random() < 0.1) {
        setDisplayHeartRate("--") // 10% chance of unable to measure
      } else {
        const noisyReading = Math.round(heartRate + (Math.random() - 0.5) * 8) // ±4 BPM variation
        setDisplayHeartRate(Math.max(45, Math.min(150, noisyReading)))
      }
      
    } else if (graphMode === 4) {
      // For heavy noise, frequently show "unable to measure"
      if (Math.random() < 0.7) {
        setDisplayHeartRate("--") // 70% chance of unable to measure
      } else {
        const veryNoisyReading = Math.round(heartRate + (Math.random() - 0.5) * 15) // ±7.5 BPM variation
        setDisplayHeartRate(Math.max(30, Math.min(180, veryNoisyReading)))
      }
      
    } else {
      // For baseline (mode 0), show no heart rate
      setDisplayHeartRate("--")
    }
  }, [graphMode, globalTime]) // Update periodically based on global time changes
  useEffect(() => {
    const ecgRef = ref(database, '/test/ecg')
    const statusRef = ref(database, '/test/status')
    const graphRef = ref(database, '/test/graph')

    const unsubscribeEcg = onValue(ecgRef, (snapshot) => {
      const value = snapshot.val()
      console.log('📡 Realtime ECG:', value)
      setCurrentEcgValue(value || 0)
    })

    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const status = snapshot.val()
      console.log('🩺 Lead Status:', status)
      setConnected(status === 'OK' || status === 'Connected')
    })

    const unsubscribeGraph = onValue(graphRef, (snapshot) => {
      const graphno = snapshot.val()
      console.log('📊 Graph Mode:', graphno)
      setGraphMode(graphno || 0)
    })

    return () => {
      unsubscribeEcg()
      unsubscribeStatus()
      unsubscribeGraph()
    }
  }, [])

  // Helper: generate original ECG signal (more perfect)
  const generateECGValue = (time, RR_interval) => {
    const t = time % RR_interval
    let value = 0

    if (t < 0.1) {
      value = 0.1 * Math.sin((t / 0.1) * Math.PI)
    } else if (t < 0.16) {
      value = 0
    } else if (t < 0.24) {
      if (t < 0.18) {
        value = 0 + (-0.2 - 0) * (t - 0.16) / (0.18 - 0.16)
      } else if (t < 0.20) {
        value = -0.2 + (1.5 - -0.2) * (t - 0.18) / (0.20 - 0.18)
      } else if (t < 0.22) {
        value = 1.5 + (-0.3 - 1.5) * (t - 0.20) / (0.22 - 0.20)
      } else {
        value = -0.3 + (0 - -0.3) * (t - 0.22) / (0.24 - 0.22)
      }
    } else if (t < 0.38) {
      value = 0.05
    } else if (t < 0.6) {
      value = 0.2 * Math.sin(((t - 0.38) / 0.22) * Math.PI)
    } else {
      value = 0
    }

    const noise = Math.random() * 0.05 - 0.025
    return value + noise
  }

  // Helper: generate alternative ECG signal (less perfect, smoother, more realistic)
  const generateECGValue2 = (time, RR_interval) => {
    const t = time % RR_interval
    let value = 0

    // P wave (smoother, less pronounced)
    if (t < 0.12) {
      value = 0.08 * Math.sin((t / 0.12) * Math.PI) * (1 + 0.1 * Math.sin(t * 15))
    } 
    // PR segment with slight variation
    else if (t < 0.18) {
      value = 0.02 * Math.sin((t - 0.12) * 20)
    }
    // QRS complex (different shape, asymmetric)
    else if (t < 0.26) {
      if (t < 0.19) {
        // Q wave (small dip)
        value = -0.15 * Math.sin(((t - 0.18) / 0.01) * Math.PI)
      } else if (t < 0.21) {
        // R wave (less sharp peak, more rounded)
        const progress = (t - 0.19) / 0.02
        value = 1.2 * Math.sin(progress * Math.PI) * (1 - 0.2 * progress)
      } else if (t < 0.23) {
        // S wave (deeper, smoother)
        value = -0.4 * Math.sin(((t - 0.21) / 0.02) * Math.PI)
      } else {
        // Return to baseline with exponential decay
        value = -0.4 * Math.exp(-((t - 0.23) / 0.03))
      }
    }
    // ST segment (slightly elevated with variation)
    else if (t < 0.40) {
      value = 0.03 + 0.02 * Math.sin((t - 0.26) * 8)
    }
    // T wave (broader, less symmetric)
    else if (t < 0.65) {
      const tProgress = (t - 0.40) / 0.25
      value = 0.15 * Math.sin(tProgress * Math.PI) * (1 + 0.3 * Math.sin(tProgress * 2 * Math.PI))
    }
    // Return to baseline
    else {
      value = 0.01 * Math.exp(-((t - 0.65) / 0.1))
    }

    // Add some baseline wander and slight irregularity
    const baselineWander = 0.02 * Math.sin(time * 0.5) + 0.01 * Math.sin(time * 1.2)
    const irregularity = 0.03 * Math.sin(time * 12) * Math.exp(-Math.abs(t - 0.2) * 5)
    
    return value + baselineWander + irregularity
  }

  // Helper: generate less noise signal
  const generateLessNoise = () => {
    return Math.random() * 0.15 - 0.075 // Random noise between -0.075 and 0.075
  }

  // Helper: generate more noise signal
  const generateMoreNoise = () => {
    return Math.random() * 0.8 - 0.4 // Random noise between -0.4 and 0.4
  }

  // Helper: get ECG value based on current mode
  const getECGValueByMode = (time, RR_interval) => {
    switch (graphMode) {
      case 0:
        return 0 // Flat baseline at 0
      case 1:
        return generateECGValue(time, RR_interval) // Original ECG pattern
      case 2:
        return generateECGValue2(time, RR_interval) // Alternative ECG pattern
      case 3:
        return generateLessNoise() // Less noise signal
      case 4:
        return generateMoreNoise() // More noise signal
      default:
        return 0
    }
  }

  // Initialize ECG data on mount
  useEffect(() => {
    const RR_interval = 60 / heartRate // Time between heartbeats in seconds
    const sampleInterval = 0.04 // 25 Hz sampling rate (was 0.02 = 50Hz)
    const displayWindow = 4 // Show 4 seconds of data
    const numPoints = Math.floor(displayWindow / sampleInterval) // 100 points for 4 seconds

    // Create an initial array with proper time spacing
    const initialData = Array.from({ length: numPoints }, (_, i) => {
      const t = i * sampleInterval
      return { 
        time: t.toFixed(2), 
        value: getECGValueByMode(t, RR_interval)
      }
    })
    
    setEcgData(initialData)
    setGlobalTime(displayWindow) // Start global time at the end of initial window
  }, [heartRate, graphMode]) // Only reset when heartRate or graphMode changes

  // Update ECG data continuously
  useEffect(() => {
    const RR_interval = 60 / heartRate
    const sampleInterval = 0.04 // 25 Hz sampling rate
    const updateInterval = 40 // Update every 40ms to match sample rate

    const interval = setInterval(() => {
      if (!isPaused) {
        setGlobalTime(prevTime => prevTime + sampleInterval)
        
        setEcgData((prevData) => {
          const newTime = globalTime + sampleInterval
          const newValue = getECGValueByMode(newTime, RR_interval)
          const newPoint = { 
            time: newTime.toFixed(2), 
            value: newValue 
          }
          
          // Keep only the last 100 points (4 seconds of data)
          const newData = [...prevData.slice(1), newPoint]
          return newData
        })
        
        // Slowly decrease battery
        setBatteryLevel((prev) => Math.max(prev - 0.05, 0))
      }
    }, updateInterval)

    return () => clearInterval(interval)
  }, [isPaused, heartRate, graphMode, globalTime])

  // Get display text for current mode
  const getSignalQualityText = () => {
    switch (graphMode) {
      case 0:
        return 'Baseline'
      case 1:
        return 'ECG Normal'
      case 2:
        return 'ECG Variant'
      case 3:
        return 'Light Noise'
      case 4:
        return 'Heavy Noise'
      default:
        return 'Unknown'
    }
  }

  // Get color for signal quality based on mode
  const getSignalQualityColor = () => {
    switch (graphMode) {
      case 0:
        return 'text-gray-500'
      case 1:
        return 'text-green-500'
      case 2:
        return 'text-blue-500'
      case 3:
        return 'text-yellow-500'
      case 4:
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

return (
  <div className="flex flex-col bg-gray-50 p-4 sm:p-6 md:p-8 rounded-lg shadow-md w-full h-screen overflow-auto">
    
    {/* Title Banner */}
    <div className="text-center text-xl sm:text-2xl font-extrabold text-indigo-600 mb-6 uppercase tracking-wider">
      MEMS LAB - 8th Semester Project
    </div>

    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
      <div className="flex items-center">
        <Activity className="text-blue-500 mr-2" size={24} />
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Real-time ECG Monitor</h1>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center text-green-500">
          <Wifi size={16} className="mr-1" />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex items-center text-amber-500">
          <Battery size={16} className="mr-1" />
          <span>{batteryLevel.toFixed(0)}%</span>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-md shadow-sm flex items-center justify-between">
        <Heart className="text-red-500 mr-2" size={20} />
        <div className="flex-1">
          <div className="text-xs text-gray-500">Heart Rate</div>
          <div className="text-xl font-bold">
            {displayHeartRate === "--" ? "--" : displayHeartRate}
            <span className="text-sm font-normal ml-1">
              {displayHeartRate === "--" ? "" : "BPM"}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-md shadow-sm flex items-center justify-between">
        <Clock className="text-blue-500 mr-2" size={20} />
        <div className="flex-1">
          <div className="text-xs text-gray-500">Sample Rate</div>
          <div className="text-xl font-bold">25 <span className="text-sm font-normal">Hz</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-md shadow-sm flex items-center justify-between">
        <Activity className={`mr-2 ${getSignalQualityColor()}`} size={20} />
        <div className="flex-1">
          <div className="text-xs text-gray-500">Signal Quality</div>
          <div className={`text-xl font-bold ${getSignalQualityColor()}`}>
            {getSignalQualityText()}
          </div>
        </div>
      </div>
    </div>

    {/* ECG Chart */}
    <div className="bg-white p-4 rounded-md shadow-sm h-64 sm:h-72 lg:h-80 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ecgData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            scale="linear"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis
            domain={[-0.5, 1.5]}
            label={{ value: 'Amplitude (mV)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value) => [`${value.toFixed(2)} mV`, 'ECG']} />
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
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button
        className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition"
      >
        Export Data
      </button>
    </div>
  </div>
)

}