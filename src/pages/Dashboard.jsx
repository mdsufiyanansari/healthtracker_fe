
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Footprints, Flame, Clock, Target, Dumbbell,
  Route, ArrowRight, Plus, CheckCircle2, Circle, Zap,
  ChevronRight, Sparkles, RefreshCw, X, LoaderCircle, AlertCircle,
} from "lucide-react";
import api from "../services/api";

const activityTypes = ["Walking", "Running", "Cycling", "Workout"];

const typeConfig = {
  Walking: { icon: Footprints, color: "bg-emerald-100 text-emerald-700" },
  Running: { icon: Route, color: "bg-blue-100 text-blue-700" },
  Cycling: { icon: Activity, color: "bg-purple-100 text-purple-700" },
  Workout: { icon: Dumbbell, color: "bg-orange-100 text-orange-700" },
};

function extractActivities(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.activities)) return payload.activities;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.activities)) return payload.data.activities;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizeActivity(item, index) {
  const rawType = String(
    item.type || item.activityType || item.activity || "Workout"
  );

  const type =
    activityTypes.find(
      (value) => value.toLowerCase() === rawType.toLowerCase()
    ) || "Workout";

  const rawDate = item.date || item.createdAt || item.startedAt;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime());

  return {
    id: item._id || item.id || `activity-${index}`,
    title: item.title || item.name || type,
    type,
    duration: Math.max(
      0,
      Number(item.durationMinutes ?? item.duration ?? item.minutes ?? 0) || 0
    ),
    calories: Math.max(
      0,
      Number(item.caloriesBurned ?? item.calories ?? 0) || 0
    ),
    distance: Math.max(
      0,
      Number(item.distanceKm ?? item.distance ?? 0) || 0
    ),
    rawDate: validDate ? parsedDate : null,
    date: validDate
      ? parsedDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "Date unavailable",
    completed: item.completed !== false && item.status !== "pending",
  };
}

function StatCard({ title, value, unit, description, icon: Icon, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </h2>
            {unit && (
              <span className="text-sm font-medium text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function ProgressBar({ value, target, color }) {
  const percentage =
    target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activePeriod, setActivePeriod] = useState("Week");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [completedGoals, setCompletedGoals] = useState([]);

  const [form, setForm] = useState({
    type: "Walking",
    durationMinutes: "20",
    distanceKm: "",
    caloriesBurned: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // GET /api/activities
      const response = await api.get("/activities");
      const list = extractActivities(response.data).map(normalizeActivity);

      list.sort(
        (a, b) =>
          (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0)
      );

      setActivities(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Activities load nahi ho paayi. Backend connection check karein."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const totalMinutes = useMemo(
    () => activities.reduce((sum, item) => sum + item.duration, 0),
    [activities]
  );

  const totalCalories = useMemo(
    () => activities.reduce((sum, item) => sum + item.calories, 0),
    [activities]
  );

  const totalDistance = useMemo(
    () => activities.reduce((sum, item) => sum + item.distance, 0),
    [activities]
  );

  const completedCount = activities.filter(
    (item) => item.completed
  ).length;

  const weekData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        date,
        day: date.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: 0,
        calories: 0,
      };
    });

    activities.forEach((activity) => {
      if (!activity.rawDate) return;

      const activityDate = new Date(activity.rawDate);
      activityDate.setHours(0, 0, 0, 0);

      const day = days.find(
        (item) => item.date.getTime() === activityDate.getTime()
      );

      if (day) {
        day.minutes += activity.duration;
        day.calories += activity.calories;
      }
    });

    return days;
  }, [activities]);

  const chartData =
    activePeriod === "Week" ? weekData : weekData.slice(-4);

  const maxMinutes = Math.max(
    ...chartData.map((item) => item.minutes),
    1
  );

  const goals = [
    {
      id: "minutes",
      title: "Daily activity",
      subtitle: "Complete 30 minutes of activity",
      value: weekData[6]?.minutes || 0,
      target: 30,
      unit: "min",
      icon: Activity,
      color: "bg-emerald-500",
    },
    {
      id: "calories",
      title: "Calorie target",
      subtitle: "Calories recorded today",
      value: weekData[6]?.calories || 0,
      target: 400,
      unit: "kcal",
      icon: Flame,
      color: "bg-orange-500",
    },
    {
      id: "sessions",
      title: "Workout sessions",
      subtitle: "Stay consistent this week",
      value: activities.filter((item) => {
        if (!item.rawDate) return false;
        const start = weekData[0]?.date;
        return start && item.rawDate >= start;
      }).length,
      target: 5,
      unit: "sessions",
      icon: Dumbbell,
      color: "bg-blue-500",
    },
  ];

  function toggleGoal(id) {
    setCompletedGoals((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleAddActivity(event) {
    event.preventDefault();
    setFormError("");

    const duration = Number(form.durationMinutes);
    const distance =
      form.distanceKm === "" ? 0 : Number(form.distanceKm);
    const calories =
      form.caloriesBurned === "" ? 0 : Number(form.caloriesBurned);

    if (!Number.isFinite(duration) || duration <= 0) {
      setFormError("Duration 0 se zyada honi chahiye.");
      return;
    }

    if (
      !Number.isFinite(distance) ||
      distance < 0 ||
      !Number.isFinite(calories) ||
      calories < 0
    ) {
      setFormError("Distance aur calories valid numbers hone chahiye.");
      return;
    }

    const payload = {
      type: form.type,
      activityType: form.type,
      title: form.type,
      durationMinutes: duration,
      duration,
      distanceKm: distance,
      caloriesBurned: calories,
      date: form.date,
      notes: form.notes.trim(),
      completed: true,
    };

    setSaving(true);

    try {
      // POST /api/activities
      await api.post("/activities", payload);

      setShowAddForm(false);
      setForm({
        type: "Walking",
        durationMinutes: "20",
        distanceKm: "",
        caloriesBurned: "",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      });

      await fetchActivities(true);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          err.message ||
          "Activity save nahi hui. Backend POST route check karein."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeForm() {
    if (saving) return;
    setShowAddForm(false);
    setFormError("");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Activity size={17} />
              FITNESS TRACKER
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Fitness Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Track your activity, review your progress, and stay consistent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchActivities(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/running-routes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Route size={17} />
              Explore routes
            </Link>

            <Link
              to="/assessment"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Sparkles size={17} />
              Workout plan
            </Link>
          </div>
        </header>

        {/* API error */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <span>
                <strong>Activities load nahi hui:</strong> {error}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchActivities(true)}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Zap size={14} />
                YOUR FITNESS JOURNEY
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Every step counts!
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50 sm:text-base">
                Build healthy habits, complete your goals, and make progress
                one workout at a time.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowAddForm(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
              >
                <Plus size={17} />
                Add activity
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <Flame size={22} className="text-amber-200" />
                <p className="mt-3 text-2xl font-bold">
                  {loading ? "—" : totalCalories.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-emerald-50">Recorded kcal</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <Clock size={22} className="text-emerald-100" />
                <p className="mt-3 text-2xl font-bold">
                  {loading ? "—" : totalMinutes.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-emerald-50">Active minutes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Activity overview
            </h2>
            <span className="text-xs text-slate-500">Backend API data</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
              <LoaderCircle size={19} className="animate-spin" />
              Loading your activity...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Active minutes"
                value={totalMinutes.toLocaleString()}
                unit="min"
                description="Total recorded activity"
                icon={Clock}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Calories burned"
                value={totalCalories.toLocaleString()}
                unit="kcal"
                description="Recorded calorie estimates"
                icon={Flame}
                color="bg-orange-50 text-orange-600"
              />
              <StatCard
                title="Workouts completed"
                value={completedCount}
                unit="sessions"
                description="Completed recorded activities"
                icon={Dumbbell}
                color="bg-purple-50 text-purple-600"
              />
              <StatCard
                title="Distance covered"
                value={totalDistance.toFixed(1)}
                unit="km"
                description="Total recorded distance"
                icon={Footprints}
                color="bg-emerald-50 text-emerald-600"
              />
            </div>
          )}
        </section>

        {/* Chart and goals */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Activity progress
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recorded workout minutes by day
                </p>
              </div>
              <div className="flex w-fit rounded-xl bg-slate-100 p-1">
                {["Week", "4 days"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setActivePeriod(period)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      activePeriod === period
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                Loading chart...
              </div>
            ) : (
              <div className="mt-7 flex h-56 items-end justify-between gap-3 border-b border-slate-100 pb-2 sm:gap-5">
                {chartData.map((item, index) => {
                  const height = (item.minutes / maxMinutes) * 100;
                  return (
                    <div
                      key={`${item.day}-${index}`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                    >
                      <span className="text-xs font-semibold text-slate-500">
                        {item.minutes}
                      </span>
                      <div className="flex h-[75%] w-full items-end justify-center">
                        <div
                          title={`${item.minutes} minutes`}
                          className={`w-full max-w-12 rounded-t-lg transition-all duration-300 ${
                            item.minutes === maxMinutes && item.minutes > 0
                              ? "bg-emerald-600"
                              : "bg-emerald-200 hover:bg-emerald-400"
                          }`}
                          style={{
                            height:
                              item.minutes === 0
                                ? "0%"
                                : `${Math.max(height, 4)}%`,
                            minHeight: item.minutes > 0 ? "8px" : 0,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && activities.length === 0 && !error && (
              <p className="mt-4 text-center text-sm text-slate-500">
                No activity data yet. Add your first activity to see progress.
              </p>
            )}

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Active minutes
            </div>
          </section>

          {/* Goals */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Fitness goals
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Progress from recorded activity
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Target size={21} />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isCompleted = completedGoals.includes(goal.id);

                return (
                  <div key={goal.id}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Icon size={17} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">
                            {goal.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {goal.subtitle}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        aria-label={
                          isCompleted
                            ? `Mark ${goal.title} incomplete`
                            : `Mark ${goal.title} complete`
                        }
                        className="shrink-0 text-emerald-600"
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={21} />
                        ) : (
                          <Circle size={21} />
                        )}
                      </button>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {goal.value} / {goal.target} {goal.unit}
                      </span>
                      <span className="text-slate-400">
                        {Math.round(
                          Math.min((goal.value / goal.target) * 100, 100)
                        )}
                        %
                      </span>
                    </div>

                    <ProgressBar
                      value={goal.value}
                      target={goal.target}
                      color={goal.color}
                    />
                  </div>
                );
              })}
            </div>

            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Goal completion marks are kept in this page's current state.
            </p>
          </section>
        </div>

        {/* Recent activities */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent activities
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest activities retrieved from your backend
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setShowAddForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={17} />
              Add activity
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading activities...
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activities.slice(0, 8).map((activity) => {
                const config = typeConfig[activity.type] || typeConfig.Workout;
                const Icon = config.icon;

                return (
                  <article
                    key={activity.id}
                    className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-3 ${config.color}`}>
                        <Icon size={21} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {activity.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {activity.type} · {activity.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={15} />
                        {activity.duration} min
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Flame size={15} />
                        {activity.calories} kcal
                      </span>
                      {activity.distance > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <Footprints size={15} />
                          {activity.distance} km
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          activity.completed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        {activity.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Activity size={32} className="mx-auto text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-800">
                No activities recorded
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add your first activity to start tracking your progress.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Add activity
              </button>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue your fitness journey
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              to="/assessment"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <Sparkles size={23} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">
                  Create workout plan
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Get a personalized plan
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </Link>

            <Link
              to="/activity"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Activity size={23} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Track activity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review and add activities
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </Link>

            <Link
              to="/running-routes"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                <Route size={23} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">
                  Explore running routes
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Find a route for your level
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-purple-600" />
            </Link>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>AI-Based Physical Fitness Tracker</p>
          <p>Dashboard activity data loaded from your backend API.</p>
        </footer>
      </div>

      {/* Add activity modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-activity-title"
            className="my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="add-activity-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add activity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Save your activity through the backend API.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label
                  htmlFor="activity-type"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Activity type
                </label>
                <select
                  id="activity-type"
                  name="type"
                  value={form.type}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="activity-duration"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Duration (minutes) *
                  </label>
                  <input
                    id="activity-duration"
                    name="durationMinutes"
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={form.durationMinutes}
                    onChange={updateForm}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity-date"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Date *
                  </label>
                  <input
                    id="activity-date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={updateForm}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity-distance"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Distance (km)
                  </label>
                  <input
                    id="activity-distance"
                    name="distanceKm"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.distanceKm}
                    onChange={updateForm}
                    placeholder="e.g. 2.5"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity-calories"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Calories (kcal)
                  </label>
                  <input
                    id="activity-calories"
                    name="caloriesBurned"
                    type="number"
                    min="0"
                    step="1"
                    value={form.caloriesBurned}
                    onChange={updateForm}
                    placeholder="e.g. 150"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="activity-notes"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="activity-notes"
                  name="notes"
                  rows="2"
                  maxLength="500"
                  value={form.notes}
                  onChange={updateForm}
                  placeholder="How did your workout go?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  {saving ? "Saving..." : "Save activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
