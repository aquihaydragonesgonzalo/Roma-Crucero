import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Activity, Coordinate } from '../types';
import { GPX_WAYPOINTS, ROMAN_WALK_TRACK_POINTS } from '../constants';

interface MapComponentProps {
    activities: Activity[];
    userLocation: Coordinate | null;
    focusedLocation: Coordinate | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ activities, userLocation, focusedLocation }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([41.8902, 12.4922], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapInstanceRef.current = map;
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear previous layers
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        activities.forEach(act => {
            const marker = L.marker([act.coords.lat, act.coords.lng]).addTo(map);
            
            const navUrl = act.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${act.coords.lat},${act.coords.lng}`;
            
            let popupContent = `
                <div style="padding: 12px; min-width: 220px; font-family: 'Roboto Condensed', sans-serif;">
                  <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #7f1d1d; font-size: 15px; text-transform: uppercase;">${act.title}</h3>
                  <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${act.locationName}</p>
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #334155; line-height: 1.4;">${act.description}</p>
                  
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="${navUrl}" target="_blank" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; background: #059669; color: white; padding: 10px; border-radius: 10px; font-weight: bold; font-size: 11px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                      CÓMO LLEGAR
                    </a>
            `;
            
            if (act.audioGuideText) {
              popupContent += `
                <button 
                  onclick="window.openAudioGuideFromMap('${act.id}')"
                  style="width: 100%; background: #991B1B; color: white; border: none; padding: 10px; border-radius: 10px; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 4px rgba(153, 27, 27, 0.2);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                  </svg>
                  AUDIOGUÍA
                </button>`;
            }
            popupContent += `</div></div>`;
            
            marker.bindPopup(popupContent);
            layersRef.current.push(marker);
        });

        GPX_WAYPOINTS.forEach(wpt => {
            const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
                radius: 6,
                fillColor: "#991B1B",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
            circleMarker.bindPopup(`<div style="font-family: 'Roboto Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #7f1d1d;">${wpt.name}</div>`);
            layersRef.current.push(circleMarker);
        });

        L.polyline(ROMAN_WALK_TRACK_POINTS, { color: '#991B1B', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        
        if (userLocation) {
            const uMarker = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }).addTo(map);
            layersRef.current.push(uMarker);
        }
    }, [activities, userLocation]);

    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export default MapComponent;