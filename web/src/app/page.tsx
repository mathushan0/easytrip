'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">✈️ EasyTrip</h1>
        <p className="text-2xl text-blue-100 mb-8">Plan Your Perfect Journey</p>
        <p className="text-lg text-blue-50 mb-12 max-w-2xl">AI-powered trip planning for explorers, voyagers, and nomads</p>
        
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/auth/signin"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition"
          >
            Sign Up
          </Link>
        </div>
        
        <div className="mt-12 flex gap-8 justify-center text-white">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
