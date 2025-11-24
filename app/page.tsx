'use client';

import dynamic from 'next/dynamic';

// Import Map component with no SSR to avoid Leaflet window issues
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดแผนที่...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <Map />
    </main>
  );
}
