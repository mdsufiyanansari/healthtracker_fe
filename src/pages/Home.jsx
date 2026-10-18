
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Footprints,
  HeartPulse,
  LayoutDashboard,
  Sparkles,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Workout Planner",
    description:
      "Get a personalized weekly workout plan based on your fitness level and goals.",
    link: "/assessment",
    label: "Create plan",
  },
  {
    icon: Activity,
    title: "Activity Tracking",
    description:
      "Record your exercise sessions, build consistency, and stay on track.",
    link: "/activity",
    label: "Track activity",
  },
  {
    icon: LayoutDashboard,
    title: "Progress Dashboard",
    description:
      "Review your fitness progress and understand where you can improve.",
    link: "/dashboard",
    label: "View progress",
  },
];

function getActivityList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.activities)) return data.activities;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getActivityDate(activity) {
  const value =
    activity.date ??
    activity.activityDate ??
    activity.createdAt;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getActivityMinutes(activity) {
  return (
    Number(
      activity.durationMinutes ??
        activity.duration ??
        activity.minutes ??
        0
    ) || 0
  );
}

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchActivities() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activities");

      setActivities(getActivityList(response.data));
    } catch (err) {
      console.error("Home activities API error:", err);

      setError(
        err.response?.data?.message ||
          "Activities load nahi ho paayi. Backend aur API route check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  // Calculate activity data for the last seven days.
  const weekActivity = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return {
        date,
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }).slice(0, 1),
        minutes: 0,
      };
    });

    activities.forEach((activity) => {
      const date = getActivityDate(activity);
      if (!date) return;

      const day = days.find(
        (item) =>
          item.date.toDateString() === date.toDateString()
      );

      if (day) {
        day.minutes += getActivityMinutes(activity);
      }
    });

    const maxMinutes = Math.max(
      1,
      ...days.map((day) => day.minutes)
    );

    return days.map((day) => ({
      ...day,
      height:
        day.minutes > 0
          ? Math.max(12, (day.minutes / maxMinutes) * 100)
          : 5,
    }));
  })();

  const totalActivities = activities.length;

  const totalMinutes = activities.reduce(
    (sum, activity) =>
      sum + getActivityMinutes(activity),
    0
  );

  const weeklyMinutes = weekActivity.reduce(
    (sum, day) => sum + day.minutes,
    0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-800">
      {/* Hero Section */}
      <section className="px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00B89C]/20 bg-[#00B89C]/10 px-4 py-2 text-xs font-bold tracking-wide text-[#008F7A] sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00B89C]" />
              YOUR FITNESS JOURNEY STARTS HERE
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Build a stronger,
              <span className="mt-1 block text-[#00B89C]">
                healthier you.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Track your activity, understand your fitness level,
              and create a personalized workout plan that fits
              your goals and lifestyle.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00B89C] px-6 py-4 font-bold text-white shadow-lg shadow-[#00B89C]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#009F87]"
              >
                Create my workout plan
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition duration-300 hover:-translate-y-1 hover:border-[#00B89C] hover:text-[#008F7A]"
              >
                <LayoutDashboard size={18} />
                View dashboard
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              {[
                "Personalized plans",
                "Progress tracking",
                "Goal focused",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-[#00B89C]"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Fitness Overview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#00B89C]/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-[#00B89C]/10 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#008F7A]">
                    YOUR PERSONAL PLAN
                  </p>

                  <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                    Fitness Overview
                  </h2>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00B89C] text-white">
                  <HeartPulse size={26} />
                </div>
              </div>

              {/* Weekly Activity Chart */}
              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">
                    Weekly activity
                  </p>

                  <span className="flex items-center gap-1 text-xs font-semibold text-[#008F7A]">
                    <TrendingUp size={15} />
                    Keep going
                  </span>
                </div>

                <p className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {loading
                    ? "Loading..."
                    : `${weeklyMinutes} minutes`}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your recorded workout time over the last seven days.
                </p>

                <div className="mt-6 grid grid-cols-7 gap-2">
                  {weekActivity.map((item, index) => (
                    <div
                      key={`${item.date.toISOString()}-${index}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex h-24 w-full items-end justify-center overflow-hidden rounded-lg bg-[#00B89C]/10 p-1">
                        <div
                          title={`${item.minutes} minutes`}
                          className="w-full rounded-md bg-[#00B89C] transition-all duration-300 hover:opacity-75"
                          style={{
                            height: `${item.height}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    <p>{error}</p>

                    <button
                      type="button"
                      onClick={fetchActivities}
                      className="mt-2 inline-flex items-center gap-2 font-semibold underline"
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  </div>
                )}

                {!loading && !error && activities.length === 0 && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    No activities recorded yet. Start tracking your
                    workouts to see your progress here.
                  </p>
                )}
              </div>

              {/* Summary Cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                    <Footprints size={21} />
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    Total activities
                  </p>

                  <p className="mt-1 break-words font-bold text-slate-900">
                    {loading ? "Loading..." : totalActivities}
                  </p>

                  <p className="mt-1 text-xs text-[#008F7A]">
                    All recorded sessions
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                    <Target size={21} />
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    Total workout time
                  </p>

                  <p className="mt-1 break-words font-bold text-slate-900">
                    {loading ? "Loading..." : `${totalMinutes} min`}
                  </p>

                  <p className="mt-1 text-xs text-[#008F7A]">
                    Across recorded sessions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-200 bg-[#00B89C]/5 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#008F7A] shadow-sm sm:text-sm">
              <Sparkles size={15} />
              Everything you need
            </div>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Your fitness journey,
              <span className="text-[#00B89C]">
                {" "}simplified.
              </span>
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Plan your workouts, track your habits, and make progress
              one session at a time.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#00B89C]/50 hover:shadow-lg hover:shadow-[#00B89C]/10 sm:p-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B89C] text-white shadow-md shadow-[#00B89C]/20 transition duration-300 group-hover:scale-105">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-slate-900 transition group-hover:text-[#008F7A]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 min-h-14 leading-7 text-slate-600">
                    {feature.description}
                  </p>

                  <Link
                    to={feature.link}
                    className="mt-6 inline-flex items-center gap-2 font-bold text-[#008F7A] transition hover:text-[#006E5D]"
                  >
                    {feature.label}

                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#00B89C] px-6 py-12 text-center shadow-xl shadow-[#00B89C]/15 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/10" />

          <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <HeartPulse size={30} />
            </div>

            <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
              Ready to get started?
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/90">
              Take the first step toward a stronger, healthier lifestyle
              with a workout plan designed around your goals.
            </p>

            <Link
              to="/assessment"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-[#008F7A] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:px-7"
            >
              Start your fitness assessment
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse size={20} className="text-[#00B89C]" />

            <span className="font-extrabold text-slate-900">
              FitTrack{" "}
              <span className="text-[#00B89C]">AI</span>
            </span>
          </Link>

          <p className="text-xs text-slate-500 sm:text-sm">
            © {new Date().getFullYear()} FitTrack AI. Build healthy
            habits, one day at a time.
          </p>

          <span className="flex items-center gap-2 text-xs font-medium text-[#008F7A]">
            <Clock3 size={15} />
            One step at a time
          </span>
        </div>
      </footer>
    </main>
  );
}
