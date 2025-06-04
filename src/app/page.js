// app/page.jsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">Welcome to ECG Analysis Suite</h1>
      <p className="mb-6">Navigate to one of the following pages:</p>
      <div className="space-x-4">
        <Link href="/monitor">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            Go to Live Monitor
          </button>
        </Link>
        <Link href="/data">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">
            Go to Data Loader
          </button>
        </Link>
      </div>
    </div>
  )
}
