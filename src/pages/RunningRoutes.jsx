import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Flame,
  Route,
  Play,
  SlidersHorizontal,
  Footprints,
  Mountain,
  Trees,
  Waves,
  LocateFixed,
  ArrowUpRight,
  X,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import RunTracker from "../components/RunTracker";
import CreateRoute from "./CreateRoute";

const filters = ["All Routes", "Easy", "Moderate", "Hard"];

const colorStyles = {
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
    gradient: "from-emerald-100 to-green-50",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    badge: "bg-blue-50 text-blue-700",
    gradient: "from-blue-100 to-cyan-50",
  },
  orange: {
    icon: "bg-orange-100 text-orange-700",
    badge: "bg-orange-50 text-orange-700",
    gradient: "from-orange-100 to-amber-50",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    badge: "bg-purple-50 text-purple-700",
    gradient: "from-purple-100 to-violet-50",
  },
  cyan: {
    icon: "bg-cyan-100 text-cyan-700",
    badge: "bg-cyan-50 text-cyan-700",
    gradient: "from-cyan-100 to-sky-50",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700",
    badge: "bg-rose-50 text-rose-700",
    gradient: "from-rose-100 to-pink-50",
  },
};

const iconMap = {
  trees: Trees,
  waves: Waves,
  mountain: Mountain,
  footprints: Footprints,
  route: Route,
  navigation: Navigation,
};

const normalizeRoute = (item, index) => {
  const difficultyValue = String(item.difficulty || "Easy").toLowerCase();
  const difficulty = ["easy", "moderate", "hard"].includes(difficultyValue)
    ? difficultyValue.charAt(0).toUpperCase() + difficultyValue.slice(1)
    : "Easy";

  const iconName = String(item.iconName || item.icon || "route")
    .toLowerCase()
    .replace("icon", "")
    .trim();

  const tags = Array.isArray(item.tags)
    ? item.tags
    : typeof item.tags === "string"
      ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  return {
    id: item._id || item.id || index + 1,
    name: item.name || item.title || `Running Route ${index + 1}`,
    location:
      item.location ||
      item.startLocation ||
      item.address ||
      "Location not specified",
    // Preserve route path and endpoint coordinates from the backend.
    // RunTracker can use these to draw the planned route on the map.
    coordinates: Array.isArray(item.coordinates) ? item.coordinates : [],
    startCoordinates: item.startCoordinates ?? null,
    endCoordinates: item.endCoordinates ?? null,
    startLocation: item.startLocation || "",
    endLocation: item.endLocation || "",
    distance: Number(item.distance ?? item.distanceKm ?? 0),
    duration: Number(
      item.duration ??
        item.durationMinutes ??
        item.estimatedMinutes ??
        0
    ),
    calories: Number(item.calories ?? item.estimatedCalories ?? 0),
    difficulty,
    elevation: Number(item.elevation ?? item.elevationMeters ?? 0),
    surface: item.surface || "Mixed",
    icon: iconMap[iconName] || Route,
    color: colorStyles[item.color] ? item.color : Object.keys(colorStyles)[index % 6],
    description:
      item.description ||
      "Explore this route and choose a comfortable pace for your fitness level.",
    tags,
  };
};

const RunningRoutes = () => {
  const [runningRoutes, setRunningRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Routes");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(15);
  const [activeRun, setActiveRun] = useState(null);
  const [showCreateRoute, setShowCreateRoute] = useState(false);

  // GET routes from backend.
  const loadRoutes = async () => {
    setIsLoadingRoutes(true);
    setApiError("");

    try {
      // Expected endpoint: GET /api/routes
      const response = await api.get("/routes");
      const payload = response?.data;

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.routes)
          ? payload.routes
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.routes)
              ? payload.data.routes
              : [];

      if (list.length === 0) {
        setRunningRoutes([]);
        setApiError("");
        return;
      }

      const normalizedRoutes = list.map(normalizeRoute);
      setRunningRoutes(normalizedRoutes);
    } catch (error) {
      console.error("Failed to load routes:", error);

      setRunningRoutes([]);
      setApiError(
        error?.response?.data?.message ||
          "Could not load routes from the server. Please try again."
      );
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  // Search, filter and sort routes.
  const filteredRoutes = useMemo(() => {
    let result = runningRoutes.filter((route) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        route.name.toLowerCase().includes(searchText) ||
        route.location.toLowerCase().includes(searchText) ||
        route.surface.toLowerCase().includes(searchText) ||
        route.description.toLowerCase().includes(searchText);

      const matchesDifficulty =
        activeFilter === "All Routes" ||
        route.difficulty === activeFilter;

      const matchesDistance =
        Number(route.distance) <= Number(maxDistance);

      return matchesSearch && matchesDifficulty && matchesDistance;
    });

    if (sortBy === "distance-low") {
      result.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === "distance-high") {
      result.sort((a, b) => b.distance - a.distance);
    } else if (sortBy === "calories") {
      result.sort((a, b) => b.calories - a.calories);
    }

    return result;
  }, [runningRoutes, search, activeFilter, sortBy, maxDistance]);

  const totalRoutes = runningRoutes.length;

  const totalDistance = runningRoutes.reduce(
    (total, route) => total + Number(route.distance || 0),
    0
  );

  const handleStartRun = (route) => {
    setSelectedRoute(null);
    setActiveRun(route);
  };

  const closeRun = () => setActiveRun(null);

  const resetFilters = () => {
    setSearch("");
    setActiveFilter("All Routes");
    setMaxDistance(15);
    setSortBy("recommended");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* API status */}
        {apiError && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{apiError}</span>

            <button
              type="button"
              onClick={loadRoutes}
              disabled={isLoadingRoutes}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-amber-300 px-3 py-2 font-semibold disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={isLoadingRoutes ? "animate-spin" : ""}
              />
              Retry API
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Route size={17} />
              FITNESS TRACKER
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Running Routes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Discover running routes, explore distances, and find a path that
              matches your fitness level.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCreateRoute((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MapPin size={17} />
              {showCreateRoute ? "Close Route Form" : "+ Create Route"}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-100"
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>
          </div>
        </div>

        {/* Create route form */}
        {showCreateRoute && (
          <CreateRoute
            onCancel={() => setShowCreateRoute(false)}
            onCreated={async () => {
              setShowCreateRoute(false);
              await loadRoutes();
            }}
          />
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Available Routes
              </p>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Route size={21} />
              </div>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {totalRoutes}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {isLoadingRoutes ? "Loading routes..." : "Loaded from API"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Combined Distance
              </p>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <MapPin size={21} />
              </div>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {totalDistance.toFixed(1)}{" "}
              <span className="text-base font-medium text-slate-500">km</span>
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Across available routes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Recommended Start
              </p>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Footprints size={21} />
              </div>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              1.5–2.5 km
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              A gentle starting range for beginners
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search route, location, or surface..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="route-sort"
                className="whitespace-nowrap text-sm text-slate-500"
              >
                Sort by
              </label>

              <select
                id="route-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 sm:flex-none"
              >
                <option value="recommended">Recommended</option>
                <option value="distance-low">Shortest distance</option>
                <option value="distance-high">Longest distance</option>
                <option value="calories">Highest calories</option>
              </select>
            </div>
          </div>

          {/* Difficulty filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Additional filters */}
          {showFilters && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="max-distance"
                  className="text-sm font-semibold text-slate-700"
                >
                  Maximum distance: {maxDistance} km
                </label>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Reset filters
                </button>
              </div>

              <input
                id="max-distance"
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={maxDistance}
                onChange={(event) =>
                  setMaxDistance(Number(event.target.value))
                }
                className="mt-4 w-full accent-emerald-600"
              />

              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>1 km</span>
                <span>15 km</span>
              </div>
            </div>
          )}
        </div>

        {/* Route list heading */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">Explore Routes</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredRoutes.length} route
            {filteredRoutes.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Loading state */}
        {isLoadingRoutes ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <LoaderCircle
              size={30}
              className="mx-auto animate-spin text-emerald-600"
            />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Loading routes...
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Fetching routes from the server.
            </p>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRoutes.map((route) => {
              const Icon = route.icon;
              const styles = colorStyles[route.color] || colorStyles.emerald;

              return (
                <article
                  key={route.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Route preview */}
                  <div
                    className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${styles.gradient}`}
                  >
                    <div className="absolute inset-0 opacity-40">
                      <svg
                        viewBox="0 0 400 180"
                        className="h-full w-full"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                      >
                        <path
                          d="M-20 130 C60 80 80 170 150 110 S250 40 320 100 S400 130 440 55"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="7 7"
                          className="text-slate-500"
                        />

                        <path
                          d="M-10 155 C60 105 95 190 165 130 S265 60 335 120 S410 150 440 75"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-slate-400"
                        />
                      </svg>
                    </div>

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-sm backdrop-blur">
                      <Icon size={35} className="text-slate-700" />
                    </div>

                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${styles.badge}`}
                    >
                      {route.difficulty}
                    </span>

                    <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {route.surface}
                    </span>

                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <MapPin size={14} />
                      {route.location}
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900">
                      {route.name}
                    </h3>

                    <p className="mt-2 min-h-[60px] text-sm leading-6 text-slate-500">
                      {route.description}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Route size={15} />
                          <span className="text-xs">Distance</span>
                        </div>
                        <p className="mt-1 text-base font-bold text-slate-800">
                          {route.distance} km
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={15} />
                          <span className="text-xs">Est. time</span>
                        </div>
                        <p className="mt-1 text-base font-bold text-slate-800">
                          {route.duration} min
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Flame size={15} />
                          <span className="text-xs">Calories</span>
                        </div>
                        <p className="mt-1 text-base font-bold text-slate-800">
                          {route.calories}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {route.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRoute(route)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                        <ArrowUpRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartRun(route)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Play size={16} fill="currentColor" />
                        Start run
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search size={25} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No routes found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {runningRoutes.length === 0
                ? "Abhi koi saved route nahi hai. Map par start aur end location select karke apna pehla route banayein."
                : "Try another search or change your difficulty and distance filters."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
              {runningRoutes.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateRoute(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Create your first route
                </button>
              )}
            </div>
          </div>
        )}

        {/* Safety note */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <LocateFixed
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
          />

          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Before you start
            </h3>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Check the actual route, weather, traffic, and your fitness level
              before running outdoors. Estimated calories and time may vary.
            </p>
          </div>
        </div>
      </div>

      {/* Route Details Modal */}
      {selectedRoute && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRoute(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    colorStyles[selectedRoute.color]?.badge ||
                    colorStyles.emerald.badge
                  }`}
                >
                  {selectedRoute.difficulty}
                </span>

                <h2
                  id="route-modal-title"
                  className="mt-3 text-xl font-bold text-slate-900"
                >
                  {selectedRoute.name}
                </h2>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={15} />
                  {selectedRoute.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoute(null)}
                aria-label="Close route details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {selectedRoute.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Distance", `${selectedRoute.distance} km`],
                ["Time", `${selectedRoute.duration} min`],
                ["Calories", `${selectedRoute.calories} kcal`],
                ["Elevation", `${selectedRoute.elevation} m`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                Route preparation
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Warm up before running, carry water when needed, and choose a
                pace that feels comfortable.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartRun(selectedRoute)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              <Play size={17} fill="currentColor" />
              Start this run
            </button>
          </div>
        </div>
      )}

      {/* GPS Run Tracker Modal */}
      {activeRun && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            // Do not dismiss the tracker by clicking outside: this could
            // unexpectedly stop an active GPS session.
            if (event.target === event.currentTarget) {
              // The tracker provides its own safe Close button when ready/finished.
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="GPS running tracker"
            className="my-auto w-full max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <RunTracker route={activeRun} onCancel={closeRun} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningRoutes;