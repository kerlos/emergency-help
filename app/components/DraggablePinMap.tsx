'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { UserLocation } from '../types';

const draggableIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCAzMiA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ0QzE2IDQ0IDMyIDE5LjMzMzMgMzIgMTZDMzIgNy4xNjM0NCAyNC44MzY2IDAgMTYgMEM3LjE2MzQ0IDAgMCA3LjE2MzQ0IDAgMTZDMCAxOS4zMzMzIDE2IDQ0IDE2IDQ0WiIgZmlsbD0iIzNBODRGRiIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44]
});

interface DraggablePinMapProps {
  location: UserLocation;
  onLocationChange: (location: UserLocation) => void;
}

function DraggableMarker({ location, onLocationChange }: DraggablePinMapProps) {
  const markerRef = useRef<any>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        onLocationChange({ latitude: pos.lat, longitude: pos.lng });
      }
    },
  };

  // Handle map clicks
  useMapEvents({
    click(e) {
      onLocationChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[location.latitude, location.longitude]}
      ref={markerRef}
      icon={draggableIcon}
    />
  );
}

export default function DraggablePinMap({ location, onLocationChange }: DraggablePinMapProps) {
  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={15}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker location={location} onLocationChange={onLocationChange} />
    </MapContainer>
  );
}

