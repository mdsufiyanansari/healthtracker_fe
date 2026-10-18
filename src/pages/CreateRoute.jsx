import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";

// Leaflet marker icons can be missing in some Vite setups; use simple div icons.
const startIcon = L.divIcon({
  className: "",
  html: '<div style="background:#16a34a;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 1px 5px #555"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const endIcon = L.divIcon({
  className: "",
  html: '<div style="background:#dc2626;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 1px 5px #555"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickHandler({ selectionMode, onSelect }) {
  useMapEvents({
    click(event) {
      if (!selectionMode) return;
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FitRouteBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28] });
    else if (points.length === 1) map.setView(points[0], 15);
  }, [map, points]);
  return null;
}

const validPoint = (point) =>
  point &&
  Number.isFinite(Number(point.lat)) &&
  Number.isFinite(Number(point.lng)) &&
  Math.abs(Number(point.lat)) <= 90 &&
  Math.abs(Number(point.lng)) <= 180;

export default function CreateRoute({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [selectionMode, setSelectionMode] = useState("start");
  const [roadPoints, setRoadPoints] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mapPoints = useMemo(() => roadPoints.length ? roadPoints : [start, end].filter(Boolean).map(p => [p.lat, p.lng]), [roadPoints, start, end]);

  const handleSelect = (point) => {
    setError("");
    setSuccess("");
    if (selectionMode === "start") {
      setStart(point);
      setEnd(null);
      setRoadPoints([]);
      setDistanceKm(0);
      setEstimatedMinutes("");
      setSelectionMode("end");
    } else {
      if (start && Math.abs(start.lat - point.lat) < 0.000001 && Math.abs(start.lng - point.lng) < 0.000001) {
        setError("Start aur end location alag select karein.");
        return;
      }
      setEnd(point);
      setRoadPoints([]);
      setDistanceKm(0);
      setEstimatedMinutes("");
      setSelectionMode("start");
    }
  };

  const calculateRoute = async () => {
    if (!validPoint(start) || !validPoint(end)) {
      setError("Map par pehle start aur end location select karein.");
      return;
    }
    setLoadingRoute(true);
    setError("");
    setSuccess("");
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Road routing service abhi available nahi hai.");
      const data = await response.json();
      const route = data?.routes?.[0];
      const geometry = route?.geometry?.coordinates;
      if (data?.code !== "Ok" || !Array.isArray(geometry) || geometry.length < 2) {
        throw new Error("In locations ke beech road route nahi mila. Doosre points select karein.");
      }

      const middle = geometry
        .filter(pair => Array.isArray(pair) && pair.length >= 2)
        .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
        .filter(validPoint);

      // Preserve the exact selected endpoints because the backend validates
      // that coordinates[0] and coordinates[last] match the endpoint fields.
      const fullPoints = [
        { lat: Number(start.lat), lng: Number(start.lng) },
        ...middle.slice(1, -1),
        { lat: Number(end.lat), lng: Number(end.lng) },
      ];
      if (fullPoints.length < 2) throw new Error("Route coordinates valid nahi hain.");

      const km = Number((Number(route.distance) / 1000).toFixed(2));
      const minutes = Math.max(1, Math.round(Number(route.duration) / 60));
      setRoadPoints(fullPoints.map(point => [point.lat, point.lng]));
      setDistanceKm(km);
      setEstimatedMinutes(String(minutes));
      setSuccess(`Road route calculate ho gaya: ${km} km`);
    } catch (err) {
      setError(err.message || "Route calculate nahi ho saka.");
      setRoadPoints([]);
      setDistanceKm(0);
      setEstimatedMinutes("");
    } finally {
      setLoadingRoute(false);
    }
  };

  const saveRoute = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (name.trim().length < 2) {
      setError("Route ka naam kam-se-kam 2 characters ka hona chahiye.");
      return;
    }
    if (!validPoint(start) || !validPoint(end) || roadPoints.length < 2 || distanceKm < 0.1) {
      setError("Pehle start/end select karke Calculate Road Route par click karein.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        distanceKm,
        estimatedMinutes: Number(estimatedMinutes) || 1,
        difficulty,
        description: description.trim(),
        startLocation: `Map point (${start.lat.toFixed(5)}, ${start.lng.toFixed(5)})`,
        endLocation: `Map point (${end.lat.toFixed(5)}, ${end.lng.toFixed(5)})`,
        startCoordinates: { lat: Number(start.lat), lng: Number(start.lng) },
        endCoordinates: { lat: Number(end.lat), lng: Number(end.lng) },
        coordinates: [
          { lat: Number(start.lat), lng: Number(start.lng) },
          ...roadPoints.slice(1, -1).map(([lat, lng]) => ({ lat: Number(lat), lng: Number(lng) })),
          { lat: Number(end.lat), lng: Number(end.lng) },
        ],
      };
      const response = await api.post("/routes", payload);
      const savedRoute = response?.data?.route;
      setSuccess(response?.data?.message || "Route successfully save ho gaya.");
      if (onCreated) onCreated(savedRoute || payload);
    } catch (err) {
      setError(err?.response?.data?.message || "Route save nahi hua. Login token aur backend API check karein.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create Running Route</h2>
          <p className="mt-1 text-sm text-slate-500">Map par click karke start aur end location select karein.</p>
        </div>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Cancel</button>}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1.5 text-sm ${selectionMode === "start" ? "bg-emerald-100 text-emerald-800" : start ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          1. Start {start ? "✓" : selectionMode === "start" ? "— select on map" : ""}
        </span>
        <span className={`rounded-full px-3 py-1.5 text-sm ${selectionMode === "end" ? "bg-red-100 text-red-800" : end ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          2. End {end ? "✓" : selectionMode === "end" ? "— select on map" : ""}
        </span>
        <button type="button" onClick={() => { setStart(null); setEnd(null); setRoadPoints([]); setDistanceKm(0); setEstimatedMinutes(""); setSelectionMode("start"); setError(""); setSuccess(""); }} className="ml-auto rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Reset points</button>
      </div>

      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={[25.2425, 86.9842]} zoom={13} scrollWheelZoom className="z-0 h-[360px] w-full sm:h-[460px]">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler selectionMode={selectionMode} onSelect={handleSelect} />
          <FitRouteBounds points={mapPoints} />
          {start && <Marker position={[start.lat, start.lng]} icon={startIcon}><Popup>Start location</Popup></Marker>}
          {end && <Marker position={[end.lat, end.lng]} icon={endIcon}><Popup>End location</Popup></Marker>}
          {roadPoints.length >= 2 && <Polyline positions={roadPoints} pathOptions={{ color: "#2563eb", weight: 5 }} />}
        </MapContainer>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <strong>Start:</strong> {start ? `${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}` : "Map par pehli jagah click karein"}
        </div>
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
          <strong>End:</strong> {end ? `${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}` : "Map par doosri jagah click karein"}
        </div>
      </div>

      <button type="button" onClick={calculateRoute} disabled={loadingRoute || !start || !end} className="mb-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
        {loadingRoute ? "Calculating road route..." : "Calculate Road Route"}
      </button>

      {distanceKm > 0 && <p className="mb-5 text-sm font-semibold text-slate-700">Estimated road distance: {distanceKm} km · Approx. {estimatedMinutes} min by car</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      <form onSubmit={saveRoute} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Route name *
          <input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100} placeholder="e.g. Morning Park Run" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Difficulty
          <select value={difficulty} onChange={event => setDifficulty(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5">
            <option>Easy</option><option>Moderate</option><option>Hard</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Description
          <textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} rows={3} placeholder="Route details (optional)" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500" />
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" disabled={saving || loadingRoute || roadPoints.length < 2} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving route..." : "Save Route"}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
        </div>
      </form>
      <p className="mt-4 text-xs leading-5 text-slate-500">Map tiles and road routing require an internet connection. Login is required to save routes. Road distance is estimated using the public OSRM routing service.</p>
    </div>
  );
}
