
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Footprints,
  MapPin,
  Flame,
  Clock,
  Plus,
  Activity,
  Bike,
  PersonStanding,
  Dumbbell,
  Target,
  X,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const initialForm = {
  title: "",
  type: "Walking",
  duration: "",
  distance: "",
  calories: "",
};

const activityTypes = ["All", "Walking", "Running", "Cycling", "Workout"];

const getActivityIcon = (type) => {
  const icons = {
    Walking: Footprints,
    Running: PersonStanding,
    Cycling: Bike,
    Workout: Dumbbell,
  };

  return icons[type] || Activity;
};

const getActivityDate = (item) => {
  const raw = item.createdAt || item.date;

  if (!raw) return null;

  if (raw === "Today" || raw === "Yesterday") {
    const date = new Date();

    if (raw === "Yesterday") {
      date.setDate(date.getDate() - 1);
    }

    return date;
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (item) => {
  const date = getActivityDate(item);

  if (!date) return item.date || "Date unavailable";

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (item) => {
  if (item.time) return item.time;

  const date = getActivityDate(item);

  return date
    ? date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
};

export default function ActivityTracker() {
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch activities from backend
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activities");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.activities)
        ? data.activities
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setActivities(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Activities load nahi ho paayin. Backend aur GET /activities route check karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Calculate statistics
  const totalDuration = useMemo(
    () =>
      activities.reduce(
        (sum, item) => sum + Number(item.duration || 0),
        0
      ),
    [activities]
  );

  const totalDistance = useMemo(
    () =>
      activities.reduce(
        (sum, item) => sum + Number(item.distance || 0),
        0
      ),
    [activities]
  );

  const totalCalories = useMemo(
    () =>
      activities.reduce(
        (sum, item) => sum + Number(item.calories || 0),
        0
      ),
    [activities]
  );

  // Filter activities
  const filteredActivities = useMemo(
    () =>
      filter === "All"
        ? activities
        : activities.filter((item) => item.type === filter),
    [activities, filter]
  );

  // Calculate weekly duration from actual activities
  const weeklyData = useMemo(() => {
    const today = new Date();
    const offset = (today.getDay() + 6) % 7;
    const monday = new Date(today);

    monday.setDate(today.getDate() - offset);
    monday.setHours(0, 0, 0, 0);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const totals = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return { day, date, value: 0 };
    });

    activities.forEach((item) => {
      const activityDate = getActivityDate(item);

      if (!activityDate) return;

      activityDate.setHours(0, 0, 0, 0);

      const index = Math.round(
        (activityDate.getTime() - monday.getTime()) / 86400000
      );

      if (index >= 0 && index < 7) {
        totals[index].value += Number(item.duration || 0);
      }
    });

    return totals;
  }, [activities]);

  const maxWeeklyDuration = Math.max(
    60,
    ...weeklyData.map((item) => item.value)
  );

  const stats = [
    {
      title: "Total Duration",
      value: totalDuration.toLocaleString("en-IN"),
      unit: "min",
      icon: Clock,
    },
    {
      title: "Total Distance",
      value: totalDistance.toFixed(1),
      unit: "km",
      icon: MapPin,
    },
    {
      title: "Calories Burned",
      value: totalCalories.toLocaleString("en-IN"),
      unit: "kcal",
      icon: Flame,
    },
    {
      title: "Activities",
      value: activities.length.toLocaleString("en-IN"),
      unit: "sessions",
      icon: Activity,
    },
  ];

  // Handle form inputs
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save activity through API
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const duration = Number(form.duration);
    const distance = Number(form.distance);
    const calories = Number(form.calories);

    if (!form.title.trim()) {
      setError("Please enter an activity name.");
      return;
    }

    if (
      !form.duration ||
      !form.distance ||
      !form.calories ||
      !Number.isFinite(duration) ||
      !Number.isFinite(distance) ||
      !Number.isFinite(calories) ||
      duration <= 0 ||
      duration > 1440 ||
      distance < 0 ||
      distance > 1000 ||
      calories < 0 ||
      calories > 10000
    ) {
      setError("Please enter valid activity details.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/activities", {
        title: form.title.trim(),
        type: form.type,
        duration,
        distance,
        calories,
      });

      setForm(initialForm);
      setShowForm(false);

      await fetchActivities();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Activity save nahi hui. Backend aur POST /activities route check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const openForm = () => {
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#008F7A]">
              <Activity size={17} />
              Fitness Dashboard
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Activity Tracker
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track your activities and monitor your fitness progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchActivities}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00B89C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#009F87] active:scale-95"
            >
              <Plus size={19} />
              Add Activity
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                    <Icon size={22} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {loading ? "—" : stat.value}
                  </h2>

                  <span className="text-sm text-gray-500">
                    {stat.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Weekly Activity and Daily Goal */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Weekly Activity
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Activity duration recorded this week
                </p>
              </div>

              <span className="rounded-lg bg-[#00B89C]/10 px-3 py-2 text-xs font-semibold text-[#008F7A]">
                This Week
              </span>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-500">
                Loading weekly progress...
              </div>
            ) : (
              <div className="flex h-56 items-end justify-between gap-2 sm:gap-4">
                {weeklyData.map((item) => (
                  <div
                    key={item.day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                  >
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        title={`${item.value} minutes`}
                        className={`w-full max-w-12 rounded-t-lg transition-all duration-300 ${
                          item.value > 0
                            ? "bg-[#00B89C] hover:bg-[#009F87]"
                            : "bg-gray-100"
                        }`}
                        style={{
                          height: `${Math.max(
                            item.value > 0 ? 5 : 0,
                            (item.value / maxWeeklyDuration) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-medium text-gray-500">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00B89C]" />
              Actual recorded activity duration (minutes)
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#00B89C] to-teal-700 p-6 text-white shadow-sm">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Target size={26} />
              </div>

              <h2 className="text-xl font-bold">Daily Activity Goal</h2>

              <p className="mt-2 text-sm leading-6 text-teal-50">
                Aim for 60 minutes of activity each day, according to your
                fitness level and personal needs.
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-teal-50">Recorded duration</span>
                <span className="font-semibold">
                  {Math.min(totalDuration, 60)} / 60 min
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (totalDuration / 60) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-teal-50">
                {totalDuration >= 60
                  ? "60 minutes of activity recorded."
                  : `${60 - totalDuration} minutes to reach 60 minutes in total.`}
              </p>

              <p className="mt-2 text-xs text-teal-50/90">
                This progress uses all loaded activities, not only today's.
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activities */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Activities
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review your saved exercise sessions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activityTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilter(type)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      filter === type
                        ? "bg-[#00B89C] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading activities...
            </div>
          ) : error && activities.length === 0 ? (
            <div className="p-8 text-center">
              <p role="alert" className="mb-4 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchActivities}
                className="rounded-xl bg-[#00B89C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#009F87]"
              >
                Try Again
              </button>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredActivities.map((item, index) => {
                const Icon = getActivityIcon(item.type);

                return (
                  <div
                    key={item._id || item.id || `${item.title}-${index}`}
                    className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                        <Icon size={23} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.title ||
                            `${item.type || "Fitness"} activity`}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(item)}
                          {formatTime(item)
                            ? ` · ${formatTime(item)}`
                            : ""}
                          {" · "}
                          {item.type || "Workout"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 sm:min-w-64">
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {Number(item.duration || 0)} min
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Distance</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {Number(item.distance || 0)} km
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Calories</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {Number(item.calories || 0)} kcal
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Activity
                size={36}
                className="mx-auto mb-3 text-gray-300"
              />

              <h3 className="font-semibold text-gray-800">
                No activities found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {filter === "All"
                  ? "Add your first activity to start tracking progress."
                  : `No ${filter.toLowerCase()} activities found. Try another filter or add a new activity.`}
              </p>

              {filter === "All" && (
                <button
                  type="button"
                  onClick={openForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00B89C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#009F87]"
                >
                  <Plus size={17} />
                  Add Activity
                </button>
              )}
            </div>
          )}
        </section>

        {error && activities.length > 0 && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Add Activity Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeForm}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-modal-title"
              className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2
                    id="activity-modal-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    Add New Activity
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter your workout details below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="activity-title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Activity Name
                  </label>

                  <input
                    id="activity-title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Morning Walk"
                    maxLength={80}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#00B89C] focus:ring-2 focus:ring-[#00B89C]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity-type"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Activity Type
                  </label>

                  <select
                    id="activity-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#00B89C] focus:ring-2 focus:ring-[#00B89C]/15"
                  >
                    <option value="Walking">Walking</option>
                    <option value="Running">Running</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Workout">Workout</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="activity-duration"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Duration (min)
                    </label>

                    <input
                      id="activity-duration"
                      name="duration"
                      type="number"
                      min="1"
                      max="1440"
                      step="1"
                      value={form.duration}
                      onChange={handleChange}
                      placeholder="30"
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#00B89C] focus:ring-2 focus:ring-[#00B89C]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="activity-distance"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Distance (km)
                    </label>

                    <input
                      id="activity-distance"
                      name="distance"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={form.distance}
                      onChange={handleChange}
                      placeholder="2.5"
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#00B89C] focus:ring-2 focus:ring-[#00B89C]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="activity-calories"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Calories (kcal)
                    </label>

                    <input
                      id="activity-calories"
                      name="calories"
                      type="number"
                      min="0"
                      max="10000"
                      step="1"
                      value={form.calories}
                      onChange={handleChange}
                      placeholder="150"
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#00B89C] focus:ring-2 focus:ring-[#00B89C]/15"
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-[#00B89C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#009F87] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Activity"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
