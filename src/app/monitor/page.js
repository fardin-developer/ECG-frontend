// app/monitor/page.jsx
import ECGMonitor from '../../components/ECGMonitor'
import Nav from '@/components/Nav'
export default function MonitorPage() {
  return <>
  <div>
    <Nav/>
    <ECGMonitor />
  </div>
  </>
}
