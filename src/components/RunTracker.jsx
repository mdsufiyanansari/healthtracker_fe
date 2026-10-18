
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  MapPin,
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

function MapViewport({ plannedCoordinates, gpsCoordinates }) {
  const map = useMap();

  useEffect(() => {
    // Keep the selected route in view. Once GPS tracking starts, fit the
    // live track only when there is no planned route to display.
    const pointsToFit = plannedCoordinates.length
      ? plannedCoordinates
      : gpsCoordinates;

    if (pointsToFit.length === 1) {
      map.setView(pointsToFit[0], 16);
    } else if (pointsToFit.length > 1) {
      map.fitBounds(pointsToFit, { padding: [24, 24], maxZoom: 16 });
    }
  }, [map, plannedCoordinates, gpsCoordinates]);

  return null;
}

function RunRouteMap({ route, gpsPoints }) {
  const sourceCoordinates = useMemo(() => {
    const toLatLng = (point) => {
      if (!point) return null;
      const lat = Number(point.lat ?? point.latitude);
      const lng = Number(point.lng ?? point.lon ?? point.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      return [lat, lng];
    };

    const saved = Array.isArray(route?.coordinates)
      ? route.coordinates.map(toLatLng).filter(Boolean)
      : [];
    if (saved.length >= 2) return saved;

    // Routes can store endpoints separately instead of a full coordinate list.
    const start = toLatLng(route?.startCoordinates ?? route?.startPoint);
    const end = toLatLng(route?.endCoordinates ?? route?.endPoint);
    if (start && end) return [start, end];
    return saved;
  }, [route]);

  const [plannedCoordinates, setPlannedCoordinates] = useState(sourceCoordinates);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Use the selected route's first and last coordinates as endpoints, then ask
  // OSRM for a road-following path between them. If routing fails, keep the
  // saved coordinates as a fallback.
  useEffect(() => {
    setPlannedCoordinates(sourceCoordinates);
    setRouteError("");

    if (sourceCoordinates.length < 2) {
      setRouteLoading(false);
      return undefined;
    }

    const start = sourceCoordinates[0];
    const end = sourceCoordinates[sourceCoordinates.length - 1];

    // Do not make a routing request if start and end are effectively identical.
    if (start[0] === end[0] && start[1] === end[1]) {
      setRouteLoading(false);
      setRouteError("Start aur end point same hain. Alag endpoints select karein.");
      return undefined;
    }

    const controller = new AbortController();

    async function fetchRoadRoute() {
      setRouteLoading(true);
      try {
        const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`;
        const url =
          `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
          "?overview=full&geometries=geojson&steps=false";

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Routing service response failed.");

        const data = await response.json();
        const geometry = data?.routes?.[0]?.geometry?.coordinates;

        if (data?.code !== "Ok" || !Array.isArray(geometry) || geometry.length < 2) {
          throw new Error("Selected endpoints ke beech road route nahi mila.");
        }

        // GeoJSON coordinates are [longitude, latitude]; Leaflet expects [latitude, longitude].
        const roadCoordinates = geometry
          .filter(
            (pair) =>
              Array.isArray(pair) &&
              pair.length >= 2 &&
              Number.isFinite(Number(pair[0])) &&
              Number.isFinite(Number(pair[1]))
          )
          .map(([lng, lat]) => [Number(lat), Number(lng)])
          .filter(
            ([lat, lng]) =>
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180
          );

        if (roadCoordinates.length < 2) {
          throw new Error("Routing service returned invalid coordinates.");
        }

        setPlannedCoordinates(roadCoordinates);
      } catch (err) {
        if (err.name !== "AbortError") {
          setRouteError(
            "Road route load nahi hua. Saved route coordinates dikhaye ja rahe hain."
          );
        }
      } finally {
        if (!controller.signal.aborted) setRouteLoading(false);
      }
    }

    fetchRoadRoute();
    return () => controller.abort();
  }, [sourceCoordinates]);

  const gpsCoordinates = useMemo(
    () => gpsPoints.map((point) => [point.latitude, point.longitude]),
    [gpsPoints]
  );

  const initialCenter =
    plannedCoordinates[0] || sourceCoordinates[0] || gpsCoordinates[0] || [20.5937, 78.9629];

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Route map</h3>
          <p className="mt-1 text-xs text-slate-500">
            {routeLoading
              ? "Road-following route load ho raha hai..."
              : plannedCoordinates.length >= 2
                ? "Selected route: start to finish"
                : "Live GPS track"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          {plannedCoordinates.length >= 2 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-4 rounded bg-blue-600" />
              Planned route
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-4 rounded bg-emerald-600" />
            Your track
          </span>
        </div>
      </div>

      <MapContainer
        center={initialCenter}
        zoom={plannedCoordinates.length ? 14 : 5}
        scrollWheelZoom
        className="z-0 h-[280px] w-full sm:h-[340px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport
          plannedCoordinates={plannedCoordinates}
          gpsCoordinates={gpsCoordinates}
        />

        {plannedCoordinates.length >= 2 && (
          <>
            <Polyline
              positions={plannedCoordinates}
              pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.9 }}
            />
            <CircleMarker
              center={plannedCoordinates[0]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#16a34a",
                fillOpacity: 1,
              }}
            >
              <Tooltip>Start point</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={plannedCoordinates[plannedCoordinates.length - 1]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#dc2626",
                fillOpacity: 1,
              }}
            >
              <Tooltip>End point</Tooltip>
            </CircleMarker>
          </>
        )}

        {gpsCoordinates.length >= 2 && (
          <Polyline
            positions={gpsCoordinates}
            pathOptions={{ color: "#059669", weight: 5, opacity: 0.95 }}
          />
        )}
        {gpsCoordinates.length > 0 && (
          <CircleMarker
            center={gpsCoordinates[gpsCoordinates.length - 1]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#059669",
              fillOpacity: 1,
            }}
          >
            <Tooltip>Current GPS position</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {(routeError || sourceCoordinates.length < 2) && (
        <p className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          {routeError ||
            "Is route mein start aur end coordinates nahi hain. Route create karte waqt coordinates array mein kam-se-kam do points (start aur end) save karein."}
        </p>
      )}
      {routeLoading && (
        <p className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Road route calculate ho raha hai. Ismein kuch seconds lag sakte hain.
        </p>
      )}
    </section>
  );
}

function getDistance(a, b) {
  const rad = (degree) => (degree * Math.PI) / 180;
  const R = 6371000;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function formatTime(total) {
  const n = Math.max(0, Math.floor(total));
  const hours = Math.floor(n / 3600);
  const minutes = Math.floor((n % 3600) / 60);
  const seconds = n % 60;

  return [hours, minutes, seconds]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
}

function formatPace(secondsPerKm) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return "--:--";
  }

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RunTracker({ route = null, onCancel }) {
  const [status, setStatus] = useState("ready");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [points, setPoints] = useState([]);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const watchId = useRef(null);
  const lastPoint = useRef(null);
  const pointsRef = useRef([]);
  const distanceRef = useRef(0);
  const elapsedRef = useRef(0);
  const accumulatedMs = useRef(0);
  const segmentStartedAt = useRef(null);
  const startedAt = useRef(null);
  const statusRef = useRef("ready");
  const finishLock = useRef(false);

  const updateStatus = (value) => {
    statusRef.current = value;
    setStatus(value);
  };

  const stopGPS = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (status !== "running") return undefined;

    const tick = () => {
      if (segmentStartedAt.current === null) return;

      const total =
        accumulatedMs.current + Date.now() - segmentStartedAt.current;

      elapsedRef.current = Math.floor(total / 1000);
      setElapsed(elapsedRef.current);
    };

    tick();
    const id = window.setInterval(tick, 500);

    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    return () => stopGPS();
  }, [stopGPS]);

  const startGPS = () => {
    if (!navigator.geolocation) {
      setError("Is browser mein GPS location supported nahi hai.");
      updateStatus("paused");
      return;
    }

    try {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          if (statusRef.current !== "running") return;

          const { latitude, longitude, accuracy: gpsAccuracy } =
            position.coords;

          setAccuracy(Math.round(gpsAccuracy));

          // Low-accuracy readings can cause incorrect distance.
          if (!Number.isFinite(gpsAccuracy) || gpsAccuracy > 35) return;

          const current = {
            latitude,
            longitude,
            accuracy: Math.round(gpsAccuracy),
            timestamp: new Date(position.timestamp).toISOString(),
            timestampMs: position.timestamp,
          };

          const previous = lastPoint.current;

          if (previous) {
            const gap = getDistance(previous, current);
            const seconds =
              (current.timestampMs - previous.timestampMs) / 1000;

            if (seconds <= 0) return;

            const speed = gap / seconds;

            // Filter GPS jitter and implausible jumps.
            if (gap < 3 || speed > 8) return;

            distanceRef.current += gap;
            setDistance(distanceRef.current);
          }

          lastPoint.current = current;

          const serializablePoint = {
            latitude: current.latitude,
            longitude: current.longitude,
            accuracy: current.accuracy,
            timestamp: current.timestamp,
          };

          pointsRef.current = [...pointsRef.current, serializablePoint];
          setPoints(pointsRef.current);
        },
        (gpsError) => {
          const messages = {
            1: "Location permission denied. Browser settings mein location allow karo.",
            2: "GPS location nahi mil rahi. Phone ki Location ON karo.",
            3: "GPS timeout. Khuli jagah mein dobara try karo.",
          };

          setError(messages[gpsError.code] || "GPS start nahi ho saka.");

          // Stop the active timer and clear the GPS watcher when tracking fails.
          if (statusRef.current === "running") {
            if (segmentStartedAt.current !== null) {
              accumulatedMs.current += Date.now() - segmentStartedAt.current;
              segmentStartedAt.current = null;
              elapsedRef.current = Math.floor(accumulatedMs.current / 1000);
              setElapsed(elapsedRef.current);
            }
            stopGPS();
            updateStatus("paused");
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        }
      );
    } catch {
      setError("GPS start nahi ho saka. Browser settings check karo.");
      updateStatus("paused");
    }
  };

  const startRun = () => {
    if (!window.isSecureContext) {
      setError("GPS ke liye HTTPS ya localhost use karo.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Browser GPS location support nahi karta.");
      return;
    }

    setError("");
    setSaveMessage("");

    if (statusRef.current === "ready") {
      startedAt.current = new Date().toISOString();
      accumulatedMs.current = 0;
      elapsedRef.current = 0;
      distanceRef.current = 0;
      pointsRef.current = [];
      lastPoint.current = null;
      finishLock.current = false;

      setElapsed(0);
      setDistance(0);
      setPoints([]);
      setAccuracy(null);
    } else if (statusRef.current === "paused") {
      lastPoint.current = null;
    } else {
      return;
    }

    segmentStartedAt.current = Date.now();
    updateStatus("running");
    startGPS();
  };

  const pauseRun = () => {
    if (statusRef.current !== "running") return;

    accumulatedMs.current += Date.now() - segmentStartedAt.current;
    segmentStartedAt.current = null;
    elapsedRef.current = Math.floor(accumulatedMs.current / 1000);

    setElapsed(elapsedRef.current);
    lastPoint.current = null;
    stopGPS();
    updateStatus("paused");
  };

  const finishRun = async () => {
    if (
      finishLock.current ||
      saving ||
      !["running", "paused"].includes(statusRef.current)
    ) {
      return;
    }

    finishLock.current = true;

    if (statusRef.current === "running") {
      accumulatedMs.current += Date.now() - segmentStartedAt.current;
      segmentStartedAt.current = null;
    }

    const finalSeconds = Math.floor(accumulatedMs.current / 1000);

    elapsedRef.current = finalSeconds;
    setElapsed(finalSeconds);
    stopGPS();
    updateStatus("finished");
    setError("");
    setSaveMessage("");

    if (pointsRef.current.length < 2 || distanceRef.current < 10) {
      setSaveMessage(
        "Sufficient GPS distance record nahi hua. Thoda chalne ke baad hi finish karo."
      );
      return;
    }

    const km = distanceRef.current / 1000;

    const payload = {
      activityType: "running",
      routeId: route?._id || route?.id || null,
      routeName: route?.name || "GPS Run",
      startedAt: startedAt.current,
      finishedAt: new Date().toISOString(),
      durationSeconds: finalSeconds,
      distanceMeters: Math.round(distanceRef.current),
      distanceKm: Number(km.toFixed(3)),
      paceSecondsPerKm: Math.round(finalSeconds / km),
      gpsRoute: pointsRef.current,
    };

    setSaving(true);

    try {
      // Backend endpoint must be POST /api/activities.
      const response = await api.post("/activities", payload);
      setSaveMessage(
        response.data?.message || "Workout successfully saved!"
      );
    } catch (saveError) {
      setSaveMessage(
        saveError.response?.data?.message ||
          "Workout save nahi hua. Login, API endpoint aur backend check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetRun = () => {
    stopGPS();
    accumulatedMs.current = 0;
    segmentStartedAt.current = null;
    elapsedRef.current = 0;
    distanceRef.current = 0;
    pointsRef.current = [];
    lastPoint.current = null;
    startedAt.current = null;
    finishLock.current = false;

    setElapsed(0);
    setDistance(0);
    setPoints([]);
    setAccuracy(null);
    setError("");
    setSaveMessage("");
    updateStatus("ready");
  };

  const km = distance / 1000;
  const pace = km >= 0.01 ? elapsed / km : null;

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Activity size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {route?.name || "GPS Run"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {status === "running"
                ? "GPS tracking active"
                : status === "paused"
                  ? "Run paused"
                  : status === "finished"
                    ? "Run finished"
                    : "Ready to run"}
            </p>
          </div>
        </div>

        {onCancel && status !== "running" && status !== "paused" && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        )}
      </div>

      <RunRouteMap route={route} gpsPoints={points} />

      {error && (
        <div className="mt-5 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0" />
          <p>{saveMessage}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <Timer size={19} className="text-emerald-700" />
          <p className="mt-3 text-xs text-slate-500">Duration</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatTime(elapsed)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <MapPin size={19} className="text-emerald-700" />
          <p className="mt-3 text-xs text-slate-500">Distance</p>
          <p className="mt-1 text-xl font-bold">{km.toFixed(2)} km</p>
        </div>

        <div className="col-span-2 rounded-2xl bg-slate-50 p-4 sm:col-span-1">
          <Activity size={19} className="text-emerald-700" />
          <p className="mt-3 text-xs text-slate-500">Average pace</p>
          <p className="mt-1 text-xl font-bold">{formatPace(pace)}</p>
          <p className="text-xs text-slate-400">min/km</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">GPS status</p>
        <p className="mt-2 text-sm text-slate-500">
          {accuracy === null
            ? "Waiting for GPS..."
            : `Accuracy: approximately ±${accuracy} m`}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Recorded GPS points: {points.length}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {status === "ready" && (
          <button
            type="button"
            onClick={startRun}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white hover:bg-emerald-700"
          >
            <Play size={18} /> Start run
          </button>
        )}

        {status === "running" && (
          <>
            <button
              type="button"
              onClick={pauseRun}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pause size={18} /> Pause
            </button>
            <button
              type="button"
              onClick={finishRun}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Square size={17} /> Finish & save
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              type="button"
              onClick={startRun}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white hover:bg-emerald-700"
            >
              <Play size={18} /> Resume
            </button>
            <button
              type="button"
              onClick={finishRun}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Square size={17} /> Finish & save
            </button>
          </>
        )}

        {status === "finished" && !saving && (
          <button
            type="button"
            onClick={resetRun}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={18} /> New run
          </button>
        )}

        {saving && (
          <div className="flex w-full items-center justify-center gap-2 py-3 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            Saving workout...
          </div>
        )}
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-400">
        GPS ke liye location permission aur HTTPS ya localhost zaroori hai.
        Phone lock ya browser background mein jaane par tracking ruk sakti hai.
      </p>
    </div>
  );
}
