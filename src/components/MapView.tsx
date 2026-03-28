import { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock } from 'lucide-react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useAppStore } from '../store/useAppStore';
import { getDistance } from 'geolib';
import { getLocalizedName, t } from '../utils/translations';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const mosqueIcon = L.divIcon({
  className: 'mosque-marker-icon',
  html: `
    <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); border: 2px solid white;">
      <div style="transform: rotate(45deg); padding-top: 2px; padding-left: 1px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
          <path d="M12 2C12 2 15 6 15 10C15 14 12 18 12 18C12 18 9 14 9 10C9 6 12 2 12 2Z"></path>
          <path d="M12 18V22"></path>
          <path d="M8 22H16"></path>
          <path d="M15 11.5C16.5 12 18.5 13 18.5 15C18.5 16 17 18 12 18C7 18 5.5 16 5.5 15C5.5 13 7.5 12 9 11.5"></path>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  tooltipAnchor: [18, -18]
});

const mosqueSelectedIcon = L.divIcon({
  className: 'mosque-marker-icon mosque-marker-selected',
  html: `
    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 6px 16px rgba(16, 185, 129, 0.5); border: 2px solid white; position: relative; z-index: 1000;">
      <div style="transform: rotate(45deg); padding-top: 3px; padding-left: 1px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C12 2 15 6 15 10C15 14 12 18 12 18C12 18 9 14 9 10C9 6 12 2 12 2Z"></path>
          <path d="M12 18V22"></path>
          <path d="M8 22H16"></path>
          <path d="M15 11.5C16.5 12 18.5 13 18.5 15C18.5 16 17 18 12 18C7 18 5.5 16 5.5 15C5.5 13 7.5 12 9 11.5"></path>
        </svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
  tooltipAnchor: [22, -22]
});

const destinationIcon = L.divIcon({
  className: 'destination-marker-icon',
  html: `
    <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); border: 2px solid white; position: relative; z-index: 1000;">
      <div style="transform: rotate(45deg); padding-top: 2px; padding-left: 1px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  tooltipAnchor: [18, -18]
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-location-ring"></div>
    <div class="user-location-dot"></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const MosqueMarker = memo(({ mosque, isSelected, onClick, mapRef }: any) => {
  return (
    <Marker
      position={[mosque.latitude, mosque.longitude]}
      icon={isSelected ? mosqueSelectedIcon : mosqueIcon}
      eventHandlers={{
        click: () => {
          onClick(mosque);
          if (mosque.latitude && mosque.longitude && mapRef.current) {
            mapRef.current.flyTo(
              [mosque.latitude, mosque.longitude],
              16,
              { duration: 1.5, easeLinearity: 0.25 }
            );
          }
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
        <div className="font-medium text-xs">{mosque.name}</div>
      </Tooltip>
    </Marker>
  );
});

function MapController({ showNearest, nearestMosques, routingToMosque, selectedMosque }: { showNearest?: boolean, nearestMosques: any[], routingToMosque: any, selectedMosque: any }) {
  const { userLocation } = useAppStore();
  const map = useMap();

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  // Invalidate size on mount and when location changes to ensure correct rendering on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (routingToMosque && isUserLocationValid) {
      if (typeof routingToMosque.latitude === 'number' && typeof routingToMosque.longitude === 'number') {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude],
          [routingToMosque.latitude, routingToMosque.longitude]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (selectedMosque) {
      if (typeof selectedMosque.latitude === 'number' && typeof selectedMosque.longitude === 'number') {
        map.flyTo([selectedMosque.latitude, selectedMosque.longitude], 15, { duration: 1.5 });
      }
    } else if (showNearest && isUserLocationValid && nearestMosques.length > 0) {
      const validNearest = nearestMosques.filter(m => 
        typeof m.latitude === 'number' && !isNaN(m.latitude) &&
        typeof m.longitude === 'number' && !isNaN(m.longitude)
      );
      if (validNearest.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude],
          ...validNearest.map(m => [m.latitude, m.longitude] as [number, number])
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (!showNearest && isUserLocationValid && !routingToMosque) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, isUserLocationValid, map, showNearest, nearestMosques, routingToMosque, selectedMosque]);

  return null;
}

function ZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  
  // Set initial zoom
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  
  return null;
}

function RouteLine({ start, end, straightDistance, isMainRoute, routeProfile = 'foot', key }: { start: [number, number], end: [number, number], straightDistance: number, isMainRoute?: boolean, routeProfile?: string, key?: string }) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);
  const [routeDistance, setRouteDistance] = useState<number>(straightDistance);
  const { setRouteInfo, language } = useAppStore();

  useEffect(() => {
    if (isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) {
      return;
    }
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const profile = routeProfile === 'foot' ? 'foot' : 'driving';
        const baseUrl = profile === 'foot' 
          ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
          : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
        
        const response = await fetch(`${baseUrl}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`);
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          // Find the route with the absolute shortest distance among all alternatives
          const bestRoute = data.routes.reduce((prev: any, current: any) => 
            (prev.distance < current.distance) ? prev : current
          );

          if (bestRoute.geometry) {
            const coords = bestRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            setPositions(coords);
            if (bestRoute.distance) {
              setRouteDistance(bestRoute.distance);
              if (isMainRoute) {
                setRouteInfo({
                  distance: bestRoute.distance,
                  duration: bestRoute.duration
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };
    fetchRoute();
    return () => { isMounted = false; };
  }, [start[0], start[1], end[0], end[1], isMainRoute, setRouteInfo, routeProfile]);

  // Clean up route info when unmounting if it's the main route
  useEffect(() => {
    return () => {
      if (isMainRoute) {
        setRouteInfo(null);
      }
    };
  }, [isMainRoute, setRouteInfo]);

  const isDriving = routeProfile === 'driving';
  
  // Google Maps Style Premium Colors
  const mainInnerColor = isDriving ? '#3B82F6' : '#10B981'; // Blue for driving, Emerald for walking
  const mainOuterColor = isDriving ? '#1D4ED8' : '#047857'; 
  
  const altInnerColor = '#9CA3AF'; // Gray
  const altOuterColor = '#4B5563'; // Dark Gray

  const innerColor = isMainRoute ? mainInnerColor : altInnerColor;
  const outerColor = isMainRoute ? mainOuterColor : altOuterColor;

  const innerWeight = isDriving ? 6 : 6;
  const outerWeight = isDriving ? 10 : 10;

  const dashArray = isDriving ? undefined : (isMainRoute ? "1, 14" : "5, 12");

  const validPositions = positions.filter(p => p && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1]));
  if (validPositions.length < 2) return null;

  return (
    <>
      {/* Outer stroke (Casing/Halo) */}
      <Polyline 
        positions={validPositions}
        color={outerColor}
        weight={outerWeight}
        opacity={isMainRoute ? 1 : 0.8}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      />
      {/* Inner colored stroke */}
      <Polyline 
        positions={validPositions}
        color={innerColor}
        weight={innerWeight}
        opacity={1}
        lineCap="round"
        lineJoin="round"
        dashArray={dashArray}
      />
    </>
  );
}

export default function MapView({ showNearest }: { showNearest?: boolean }) {
  const { mosques, userLocation, selectedMosque, setSelectedMosque, language, routingToMosque, setRoutingToMosque, routeProfile, selectedCommune, mapStyle, setMapStyle } = useAppStore();
  const [zoom, setZoom] = useState(12);

  const isUserLocationValid = userLocation && 
    typeof userLocation.latitude === 'number' && !isNaN(userLocation.latitude) &&
    typeof userLocation.longitude === 'number' && !isNaN(userLocation.longitude);

  // Default center (Casablanca)
  const center = isUserLocationValid 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [33.5731, -7.5898] as [number, number];

  const filteredByCommune = useMemo(() => {
    const validMosques = mosques.filter(m => 
      typeof m.latitude === 'number' && !isNaN(m.latitude) && m.latitude !== 0 &&
      typeof m.longitude === 'number' && !isNaN(m.longitude) && m.longitude !== 0
    );
    if (!selectedCommune) return validMosques;
    return validMosques.filter(m => m.commune === selectedCommune);
  }, [mosques, selectedCommune]);

  const [roadDistances, setRoadDistances] = useState<Record<number, number>>({});
  const [roadDurations, setRoadDurations] = useState<Record<number, number>>({});

  const nearestMosques = useMemo(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return [];
    
    // First, get top 15 by straight line to limit API calls
    const withStraightDistance = filteredByCommune.map(mosque => {
      try {
        return {
          ...mosque,
          straightDistance: getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: mosque.latitude, longitude: mosque.longitude }
          )
        };
      } catch (e) {
        return { ...mosque, straightDistance: Infinity };
      }
    });

    const topCandidates = withStraightDistance
      .sort((a, b) => a.straightDistance - b.straightDistance)
      .slice(0, 15);

    // If we have road distances, use them for sorting. Otherwise, if we have durations, use them.
    const withRoadMetrics = topCandidates.map(m => ({
      ...m,
      distance: roadDistances[m.id] !== undefined ? roadDistances[m.id] : m.straightDistance,
      duration: roadDurations[m.id] !== undefined ? roadDurations[m.id] : Infinity
    }));

    return withRoadMetrics
      .sort((a, b) => {
        // If we have durations for both, sort by duration (fastest route)
        if (a.duration !== Infinity && b.duration !== Infinity) {
          return a.duration - b.duration;
        }
        // Otherwise sort by distance (road distance if available, else straight line)
        return a.distance - b.distance;
      })
      .slice(0, 3);
  }, [filteredByCommune, userLocation, roadDistances, roadDurations]);

  // Fetch road distances for top candidates
  useEffect(() => {
    if (!isUserLocationValid || filteredByCommune.length === 0) return;

    const fetchRoadDistances = async () => {
      try {
        // Get top 15 by straight line
        const top15 = [...filteredByCommune]
          .map(m => {
            let d = Infinity;
            try {
              d = getDistance(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: m.latitude, longitude: m.longitude }
              );
            } catch (e) {}
            return {
              id: m.id,
              lat: m.latitude,
              lng: m.longitude,
              d
            };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, 15);

        if (top15.length === 0) return;

        // We only need to check the top 5 to find the true top 3 nearest
        const top5 = top15.slice(0, 5);
        const distances: Record<number, number> = {};
        const durations: Record<number, number> = {};

        // Fetch individual routes for the top 5 candidates to get accurate distances for the selected profile
        // This is better than the table API because the public table API only supports driving
        const promises = top5.map(async (m) => {
          try {
            const profile = (routeProfile || 'foot') === 'foot' ? 'foot' : 'driving';
            const baseUrl = profile === 'foot' 
              ? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
              : 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
            
            const response = await fetch(`${baseUrl}/${userLocation.longitude},${userLocation.latitude};${m.lng},${m.lat}?overview=false&alternatives=true`);
if (!response.ok) return null;
const data = await response.json();
if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
  // Find the route with the shortest distance among all alternatives
  const bestRoute = data.routes.reduce((prev: any, current: any) =>
    (prev.distance < current.distance) ? prev : current
  );
  return { id: m.id, distance: bestRoute.distance, duration: bestRoute.duration };
}
          } catch (e) {
  console.error(`Error fetching route for mosque ${m.id}:`, e);
}
return null;
        });

const results = await Promise.all(promises);

results.forEach(res => {
  if (res) {
    distances[res.id] = res.distance;
    durations[res.id] = res.duration;
  }
});

setRoadDistances(distances);
setRoadDurations(durations);
      } catch (error) {
  console.error("Error fetching road distances:", error);
}
    };

fetchRoadDistances();
  }, [userLocation, filteredByCommune, routeProfile]);

const displayedMosques = showNearest && isUserLocationValid ? nearestMosques : filteredByCommune;

return (
  <div className="w-full h-full">
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full"
      zoomControl={false}
    >
      <ZoomListener onZoomChange={setZoom} />

      {mapStyle === 'street' ? (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      ) : (
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      )}

      {isUserLocationValid && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        />
      )}

      {routingToMosque && isUserLocationValid && (
        <RouteLine
          key={`route-single-${routingToMosque.id}-${routeProfile}`}
          start={[userLocation.latitude, userLocation.longitude]}
          end={[routingToMosque.latitude, routingToMosque.longitude]}
          straightDistance={getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: routingToMosque.latitude, longitude: routingToMosque.longitude }
          )}
          isMainRoute={true}
          routeProfile={routeProfile}
        />
      )}

      {showNearest && isUserLocationValid && !routingToMosque && nearestMosques.map((mosque) => {
        if (typeof mosque.latitude !== 'number' || typeof mosque.longitude !== 'number') return null;
        return (
          <RouteLine
            key={`route-${mosque.id}-${routeProfile}`}
            start={[userLocation.latitude, userLocation.longitude]}
            end={[mosque.latitude, mosque.longitude]}
            straightDistance={(mosque as any).distance || 0}
            routeProfile={routeProfile}
          />
        );
      })}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {displayedMosques
          .filter(m => !routingToMosque || m.id !== routingToMosque.id)
          .map((mosque) => (
            <Marker
              key={mosque.id}
              position={[mosque.latitude, mosque.longitude]}
              icon={selectedMosque?.id === mosque.id ? mosqueSelectedIcon : mosqueIcon}
              eventHandlers={{
                click: () => {
                  setSelectedMosque(mosque);
                  setRoutingToMosque(null);
                },
              }}
            >
              {(zoom >= 14 || showNearest) && (
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={0.9}
                  permanent
                  className="bg-white/90 border-none shadow-md rounded px-2 py-1"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-center text-gray-800"
                      title={getLocalizedName(mosque, language)}
                    >
                      {getLocalizedName(mosque, language)}
                    </div>
                    {showNearest && roadDistances[mosque.id] !== undefined && (
                      <div className="text-[10px] font-semibold text-blue-600 mt-0.5 bg-blue-50 px-1.5 rounded">
                        {(roadDistances[mosque.id] / 1000).toFixed(1)} km
                      </div>
                    )}
                  </div>
                </Tooltip>
              )}
            </Marker>
          ))}
      </MarkerClusterGroup>

      {routingToMosque && (
        <Marker
          position={[routingToMosque.latitude, routingToMosque.longitude]}
          icon={destinationIcon}
          eventHandlers={{
            click: () => {
              setSelectedMosque(routingToMosque);
            },
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={0.9}
            permanent
            className="bg-white/90 border-none shadow-md rounded px-2 py-1 ring-2 ring-red-500"
          >
            <div className="flex flex-col items-center">
              <div
                className="max-w-[100px] sm:max-w-[150px] truncate text-xs font-bold text-center text-red-600"
                title={getLocalizedName(routingToMosque, language)}
              >
                {getLocalizedName(routingToMosque, language)}
              </div>
              {roadDistances[routingToMosque.id] !== undefined && (
                <div className="text-[10px] font-semibold text-red-600 mt-0.5 bg-red-50 px-1.5 rounded">
                  {(roadDistances[routingToMosque.id] / 1000).toFixed(1)} km
                </div>
              )}
            </div>
          </Tooltip>
        </Marker>
      )}

      <MapController showNearest={showNearest} nearestMosques={nearestMosques} routingToMosque={routingToMosque} selectedMosque={selectedMosque} />
    </MapContainer>

    <AnimatePresence>
      {showNearest && nearestMosques.length > 0 && !routingToMosque && (
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute bottom-24 left-0 right-0 z-[1000] pb-2 pt-4 px-4 overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-4 min-w-max">
            {nearestMosques.map((mosque, i) => (
              <motion.button
                key={mosque.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setSelectedMosque(mosque);
                  setRoutingToMosque(null);
                }}
                className={`flex flex-col text-left bg-white/95 backdrop-blur-xl rounded-[24px] p-3 shadow-bottom-sheet w-[240px] border transition-all active:scale-95 ${selectedMosque?.id === mosque.id ? 'border-emerald-400 ring-4 ring-emerald-500/10' : 'border-white/50'}`}
              >
                <div className="relative w-full h-24 rounded-[16px] overflow-hidden mb-3">
                   {mosque.image ? (
                    <img src={mosque.image} alt={getLocalizedName(mosque, language)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100" />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white text-[10px] uppercase font-black tracking-widest leading-none">
                      #{i + 1} {t('Nearest', language)}
                    </span>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 leading-tight mb-1 truncate">{getLocalizedName(mosque, language)}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 font-bold px-2 py-1 rounded-lg">
                    {roadDurations[mosque.id] ? (
                      <>
                        <Clock size={12} className="shrink-0" />
                        {Math.round(roadDurations[mosque.id] / 60)} min
                      </>
                    ) : (
                      <>
                        <Navigation size={12} className="shrink-0" />
                        {(() => {
                           try {
                             return (getDistance(
                               { latitude: userLocation!.latitude, longitude: userLocation!.longitude },
                               { latitude: mosque.latitude, longitude: mosque.longitude }
                             ) / 1000).toFixed(1) + ' km';
                           } catch (e) {
                             return '';
                           }
                        })()}
                      </>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{t(mosque.type, language)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
