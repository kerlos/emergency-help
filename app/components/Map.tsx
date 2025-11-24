'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HelpRequest, UserLocation } from '../types';
import AddPinModal from './AddPinModal';
import ViewPinModal from './ViewPinModal';

// Fix Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userLocationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzMwODRGRiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const helpRequestIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCAzMiA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ0QzE2IDQ0IDMyIDE5LjMzMzMgMzIgMTZDMzIgNy4xNjM0NCAyNC44MzY2IDAgMTYgMEM3LjE2MzQ0IDAgMCA3LjE2MzQ0IDAgMTZDMCAxOS4zMzMzIDE2IDQ0IDE2IDQ0WiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44]
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to handle map centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function Map() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.0084, 100.4768]); // Hat Yai (หาดใหญ่) default
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch help requests
  const fetchHelpRequests = async () => {
    try {
      const response = await fetch('/api/help-requests');
      if (response.ok) {
        const data = await response.json();
        // Ensure data is always an array
        setHelpRequests(Array.isArray(data) ? data : []);
      } else {
        // If response is not ok, set empty array
        setHelpRequests([]);
      }
    } catch (error) {
      console.error('Error fetching help requests:', error);
      setHelpRequests([]);
    }
  };

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter([location.latitude, location.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาเปิดใช้งาน Location Services');
        }
      );
    } else {
      setLocationError('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
    }
  }, []);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchHelpRequests();

    // Set up 30-second auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      fetchHelpRequests();
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchHelpRequests();
    setIsLoading(false);

    // Reset the interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      fetchHelpRequests();
    }, 30000);
  };

  const handleMarkerClick = (request: HelpRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleAddSuccess = () => {
    fetchHelpRequests();
  };

  const handleUpdateSuccess = () => {
    fetchHelpRequests();
  };

  return (
    <div className="relative w-full h-screen">
      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg text-sm">
          {locationError}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController center={mapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>ตำแหน่งของคุณ</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Help Request Markers */}
        {helpRequests.map((request) => (
          <Marker
            key={request.id}
            position={[request.latitude, request.longitude]}
            icon={helpRequestIcon}
            eventHandlers={{
              click: () => handleMarkerClick(request),
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>ต้องการความช่วยเหลือ</strong>
                <p className="text-xs text-gray-600 mt-1">
                  {request.num_people}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-white hover:bg-gray-50 text-gray-700 w-12 h-12 rounded-lg shadow-lg flex items-center justify-center disabled:opacity-50"
          title="รีเฟรช"
        >
          <svg
            className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Add Help Request Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="absolute bottom-8 right-4 z-[1000] bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full shadow-lg font-medium text-base flex items-center gap-2 min-h-[56px]"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>ขอความช่วยเหลือ</span>
      </button>

      {/* Modals */}
      <AddPinModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userLocation={userLocation}
        onSuccess={handleAddSuccess}
      />

      <ViewPinModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        helpRequest={selectedRequest}
        onUpdate={handleUpdateSuccess}
      />
    </div>
  );
}

