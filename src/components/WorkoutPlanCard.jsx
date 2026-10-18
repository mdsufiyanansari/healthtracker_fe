
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Clock,
  Flame,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import WorkoutPlanCard from "../components/WorkoutPlanCard";
import api from "../services/api";

export default function WorkoutPlan() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkoutPlan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/assessments/latest");

      // API response ke common response formats handle karo.
      const data = response.data;
      const latestPlan =
        data?.assessment?.plan ??
        data?.assessment?.weeklyPlan ??
        data?.plan ??
        data?.weeklyPlan ??
        null;

      if (latestPlan) {
        const normalizedPlan = Array.isArray(latestPlan)
          ? { weeklyPlan: latestPlan }
          : latestPlan;

        setPlan(normalizedPlan);
      } else {
        setPlan(null);
      }
    } catch (err) {
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        setError("Apna workout plan dekhne ke liye pehle login karo.");
      } else if (!err.response) {
        setError(
          "Backend se connection nahi ho pa raha. Check karo ki server chal raha hai."
        );
      } else if (status === 404) {
        setPlan(null);
      } else {
        setError(
          err.response?.data?.message ||
            "Workout plan load nahi ho paya. Dobara try karo."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkoutPlan();
  }, [fetchWorkoutPlan]);

  const weeklyPlan = Array.isArray(plan?.weeklyPlan)
    ? plan.weeklyPlan
    : [];

  const totalMinutes = weeklyPlan.reduce(
    (total, workout) =>
      total + (Number(workout.durationMinutes) || 0),
    0
  );

  const activeDays = weeklyPlan.filter(
    (workout) => Number(workout.durationMinutes) > 0
  ).length;

  const handleStart = (workout) => {
    navigate("/activity", {
      state: {
        workout: {
          title: workout.activity || "Workout",
          day: workout.day || "",
          durationMinutes: Number(workout.durationMinutes) || 0,
          intensity: workout.intensity || "Moderate",
        },
      },
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white px-4">
        <div className="text-center">
          <LoaderCircle
            size={42}
            className="mx-auto animate-spin text-[#00B89C]"
          />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Loading your workout plan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Please wait while we fetch your latest plan.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[60vh] bg-white px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
          <AlertCircle size={40} className="mx-auto text-red-500" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load workout plan
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {(error.includes("login") || error.includes("Login")) && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-xl bg-[#00B89C] px-5 py-3 font-semibold text-white transition hover:bg-[#009F87]"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={fetchWorkoutPlan}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (weeklyPlan.length === 0) {
    return (
      <main className="min-h-[60vh] bg-white px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00B89C]/10 text-[#008F7A]">
            <Dumbbell size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Your Workout Plan
          </h1>

          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            Abhi koi saved workout plan nahi mila. Fitness assessment
            complete karo aur apne fitness goal ke according plan banao.
          </p>

          <button
            type="button"
            onClick={() => navigate("/assessment")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00B89C] px-6 py-3 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#009F87]"
          >
            <Sparkles size={18} />
            Create Workout Plan
          </button>

          <button
            type="button"
            onClick={fetchWorkoutPlan}
            className="mx-auto mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#008F7A]"
          >
            <RefreshCw size={15} />
            Refresh plan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#00B89C]/10 px-3 py-1.5 text-xs font-bold text-[#008F7A]">
              <Sparkles size={14} />
              PERSONALIZED FITNESS
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Your Workout Plan
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Follow your personalized weekly training schedule and build
              healthier habits one day at a time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/assessment")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#00B89C] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#009F87]"
          >
            <Sparkles size={18} />
            Update Plan
          </button>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={CalendarDays}
            label="Scheduled Days"
            value={activeDays}
            suffix="days"
          />

          <SummaryCard
            icon={Clock}
            label="Weekly Training Time"
            value={totalMinutes}
            suffix="min"
          />

          <SummaryCard
            icon={Dumbbell}
            label="Planned Sessions"
            value={weeklyPlan.length}
            suffix="sessions"
          />
        </section>

        {/* Workout List */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Weekly Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a session to open your activity tracker.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchWorkoutPlan}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#00B89C] hover:text-[#008F7A]"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {weeklyPlan.map((workout, index) => {
              const duration = Number(workout.durationMinutes) || 0;
              const isRestDay = duration === 0;

              return (
                <WorkoutPlanCard
                  key={`${workout.day || "day"}-${index}`}
                  title={workout.activity || "Workout Session"}
                  description={
                    isRestDay
                      ? "Recovery is an important part of your fitness journey."
                      : `${workout.intensity || "Moderate"} intensity training session.`
                  }
                  level={workout.intensity || "Moderate"}
                  duration={duration}
                  calories={0}
                  exercises={0}
                  day={workout.day || `Day ${index + 1}`}
                  status={isRestDay ? "rest" : "planned"}
                  onStart={
                    isRestDay
                      ? undefined
                      : () => handleStart(workout)
                  }
                />
              );
            })}
          </div>
        </section>

        {/* Safety Notes */}
        {Array.isArray(plan?.safetyNotes) &&
          plan.safetyNotes.length > 0 && (
            <section className="rounded-2xl border border-[#00B89C]/20 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#00B89C]/10 p-2.5 text-[#008F7A]">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Safety Reminders
                  </h2>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {plan.safetyNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

        <p className="text-center text-xs leading-5 text-slate-500">
          Listen to your body, warm up before exercise, and rest if you feel
          pain or dizziness.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value, suffix }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#00B89C]/40 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
          <Icon size={22} />
        </div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {value}
            <span className="ml-1.5 text-sm font-medium text-slate-500">
              {suffix}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
