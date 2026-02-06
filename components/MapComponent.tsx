import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Activity, Coordinate, Waypoint } from '../types';
import { GPX_WAYPOINTS, ROMAN_WALK_TRACK_POINTS } from '../constants';

interface MapComponentProps {
    activities: Activity[];
    userLocation: Coordinate | null;
    focusedLocation: Coordinate | null;
    userWaypoints?: Waypoint[];
    onAddUserWaypoint?: (name: string, lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ activities, userLocation, focusedLocation, userWaypoints = [], onAddUserWaypoint }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // 1. Definir las capas base
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        });

        // 2. Inicializar el mapa
        const map = L.map(mapContainerRef.current, { 
            zoomControl: false,
            layers: [streetLayer] 
        }).setView([41.8902, 12.4922], 14);

        // 3. Control de capas
        const baseMaps = {
            "Calle": streetLayer,
            "Satélite": satelliteLayer
        };
        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Effect for Click Handler (Adding Waypoints)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !onAddUserWaypoint) return;

        // Limpiar handler anterior
        if (clickHandlerRef.current) {
            map.off('click', clickHandlerRef.current);
        }

        // Crear nuevo handler
        clickHandlerRef.current = (e: L.LeafletMouseEvent) => {
            const name = window.prompt("Nombre para este punto de interés:");
            if (name && name.trim().length > 0) {
                onAddUserWaypoint(name, e.latlng.lat, e.latlng.lng);
            }
        };

        map.on('click', clickHandlerRef.current);

        return () => {
            if (map && clickHandlerRef.current) {
                map.off('click', clickHandlerRef.current);
            }
        };
    }, [onAddUserWaypoint]);

    // Effect for Rendering Layers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear previous layers
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        // 1. Render Activities (Red/Standard)
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

        // 2. Render System GPX Waypoints (Red circles)
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

        // 3. Render User Waypoints (Emerald circles)
        userWaypoints.forEach(uWpt => {
             const userMarker = L.circleMarker([uWpt.lat, uWpt.lng], {
                radius: 8,
                fillColor: "#10b981", // Emerald 500
                color: "#fff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);
            
            const popupContent = `
                <div style="font-family: 'Roboto Condensed', sans-serif; padding: 4px;">
                    <p style="font-size: 13px; font-weight: bold; color: #064e3b; margin: 0 0 8px 0;">${uWpt.name}</p>
                    <button onclick="window.deleteUserWaypoint('${uWpt.id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold; width: 100%;">
                        ELIMINAR
                    </button>
                </div>
            `;
            
            userMarker.bindPopup(popupContent);
            layersRef.current.push(userMarker);
        });

        L.polyline(ROMAN_WALK_TRACK_POINTS, { color: '#991B1B', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        
        if (userLocation) {
            const uMarker = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }).addTo(map);
            layersRef.current.push(uMarker);
        }
    }, [activities, userLocation, userWaypoints]);

    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />;
};

export default MapComponent;