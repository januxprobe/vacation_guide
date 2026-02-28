'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type Coord = { lat: number; lng: number };

export interface WalkingRouteResult {
  geometry: [number, number][];
  totalDuration: number; // seconds
  legDurations: number[]; // seconds per leg
}

/**
 * Decode an encoded polyline string (Valhalla uses precision 6).
 */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const inv = 1.0 / Math.pow(10, precision);
  const decoded: [number, number][] = [];
  const previous = [0, 0];
  let i = 0;

  while (i < encoded.length) {
    const ll = [0, 0];
    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let byte = 0x20;
      while (byte >= 0x20) {
        byte = encoded.charCodeAt(i) - 63;
        i++;
        ll[j] |= (byte & 0x1f) << shift;
        shift += 5;
      }
      ll[j] = previous[j] + (ll[j] & 1 ? ~(ll[j] >> 1) : ll[j] >> 1);
      previous[j] = ll[j];
    }
    decoded.push([ll[0] * inv, ll[1] * inv]);
  }

  return decoded;
}

/**
 * Fetches a pedestrian walking route from Valhalla (OpenStreetMap).
 * Uses the free public instance at valhalla1.openstreetmap.de.
 * Caches results by coordinate hash, falls back to null on error.
 */
export function useWalkingRoute(coordinates: Coord[], enabled: boolean) {
  const [routeResult, setRouteResult] = useState<WalkingRouteResult | null>(null);
  const cacheRef = useRef<Map<string, WalkingRouteResult>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const coordsKey = useCallback((coords: Coord[]) => {
    return coords.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join('|');
  }, []);

  useEffect(() => {
    if (!enabled || coordinates.length < 2) {
      setRouteResult(null);
      return;
    }

    const key = coordsKey(coordinates);

    // Check cache
    const cached = cacheRef.current.get(key);
    if (cached) {
      setRouteResult(cached);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const locations = coordinates.map((c) => ({ lat: c.lat, lon: c.lng }));

    fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations,
        costing: 'pedestrian',
        directions_options: { units: 'km' },
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Valhalla ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.trip?.legs) {
          // Combine shapes from all legs into one polyline
          const allPoints: [number, number][] = [];
          const legDurations: number[] = [];
          let totalDuration = 0;

          for (const leg of data.trip.legs) {
            // Extract duration from leg summary
            const legTime = leg.summary?.time ?? 0;
            legDurations.push(legTime);
            totalDuration += legTime;

            if (leg.shape) {
              const points = decodePolyline(leg.shape);
              // Skip first point of subsequent legs (it's the same as last of previous)
              if (allPoints.length > 0 && points.length > 0) {
                allPoints.push(...points.slice(1));
              } else {
                allPoints.push(...points);
              }
            }
          }
          if (allPoints.length >= 2) {
            const result: WalkingRouteResult = {
              geometry: allPoints,
              totalDuration,
              legDurations,
            };
            cacheRef.current.set(key, result);
            setRouteResult(result);
          } else {
            setRouteResult(null);
          }
        } else {
          setRouteResult(null);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setRouteResult(null);
        }
      });

    return () => {
      controller.abort();
    };
  }, [coordinates, enabled, coordsKey]);

  return routeResult;
}
