
import { useState } from "react";
import { generateWorkoutPlan } from "../services/api";
import {
  Activity,
  CalendarDays,
  Clock3,
  Footprints,
  Gauge,
  HeartPulse,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const initialForm = {
  age: 22,
  fitnessLevel: "Beginner",
  currentDistanceKm: 1,
  targetDistanceKm: 3,
  weeklyTrainingDays: 4,
  availableMinutes: 30,
};

const inputClass =
  "mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00B89C] focus:ring-4 focus:ring-[#00B89C]/10";

const fields = [
  {
    name: "age",
    label: "Your age",
    description: "Your age in years",
    min: 16,
    max: 100,
    step: 1,
    icon: CalendarDays,
  },
  {
    name: "currentDistanceKm",
    label: "Current running distance",
    description: "How far can you currently run?",
    min: 0,
    max: 100,
    step: 0.1,
    suffix: "km",
    icon: Footprints,
  },
  {
    name: "targetDistanceKm",
    label: "Target running distance",
    description: "Your desired running distance",
    min: 0.1,
    max: 100,
    step: 0.1,
    suffix: "km",
    icon: Target,
  },
  {
    name: "weeklyTrainingDays",
    label: "Training days per week",
    description: "Choose between 2 and 6 days",
    min: 2,
    max: 6,
    step: 1,
    icon: CalendarDays,
  },
  {
    name: "availableMinutes",
    label: "Available workout time",
    description: "Time available for each session",
    min: 10,
    max: 180,
    step: 1,
    suffix: "min",
    icon: Clock3,
  },
];

const fitnessLevels = [
  {
    value: "Beginner",
    title: "Beginner",
    description: "Just getting started",
  },
  {
    value: "Intermediate",
    title: "Intermediate",
    description: "Building consistency",
  },
  {
    value: "Advanced",
    title: "Advanced",
    description: "Ready for a challenge",
  },
];

export default function FitnessAssessment() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    const age = Number(form.age);
    const currentDistance = Number(form.currentDistanceKm);
    const targetDistance = Number(form.targetDistanceKm);
    const trainingDays = Number(form.weeklyTrainingDays);
    const availableMinutes = Number(form.availableMinutes);

    if (!Number.isFinite(age) || age < 16 || age > 100) {
      return "Age 16 se 100 years ke beech honi chahiye.";
    }

    if (
      !Number.isFinite(currentDistance) ||
      currentDistance < 0 ||
      currentDistance > 100
    ) {
      return "Current running distance 0 se 100 km ke beech honi chahiye.";
    }

    if (
      !Number.isFinite(targetDistance) ||
      targetDistance <= 0 ||
      targetDistance > 100
    ) {
      return "Target running distance 0 se zyada aur 100 km tak honi chahiye.";
    }

    if (
      !Number.isInteger(trainingDays) ||
      trainingDays < 2 ||
      trainingDays > 6
    ) {
      return "Training days 2 se 6 ke beech select karein.";
    }

    if (
      !Number.isInteger(availableMinutes) ||
      availableMinutes < 10 ||
      availableMinutes > 180
    ) {
      return "Workout duration 10 se 180 minutes ke beech honi chahiye.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setPlan(null);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setPlan(null);

    const payload = {
      age: Number(form.age),
      fitnessLevel: form.fitnessLevel,
      currentDistanceKm: Number(form.currentDistanceKm),
      targetDistanceKm: Number(form.targetDistanceKm),
      weeklyTrainingDays: Number(form.weeklyTrainingDays),
      availableMinutes: Number(form.availableMinutes),
    };

    try {
      // Backend API call
      const result = await generateWorkoutPlan(payload);

      // Support common response structures
      const responseData = result?.data ?? result;
      const generatedPlan =
        responseData?.plan ??
        responseData?.data?.plan ??
        responseData?.workoutPlan;

      if (
        !generatedPlan ||
        !Array.isArray(generatedPlan.weeklyPlan)
      ) {
        throw new Error(
          "Backend se valid workout plan nahi mila. API response check karein."
        );
      }

      setPlan(generatedPlan);
      setSuccessMessage(
        responseData?.message ||
          "Your workout plan has been generated successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Workout plan generate nahi hua. Backend connection check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setPlan(null);
    setError("");
    setSuccessMessage("");
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-800 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#00B89C] p-6 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide">
              <Sparkles size={15} />
              PERSONALIZED FITNESS PLANNER
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Your fitness, your plan.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
              Enter your fitness level, running goals, and daily schedule.
              Generate a weekly workout plan based on your details.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-medium">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[#008F7A]">
                <CheckCircle2 size={17} />
                Personalized plan
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5">
                <HeartPulse size={17} />
                Fitness goals
              </span>
            </div>
          </div>
        </section>

        {/* Page title */}
        <div className="mb-7">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#008F7A]">
            <Activity size={17} />
            Start your journey
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Fitness Assessment
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Complete the form to request your personalized weekly running
            and fitness plan from the backend.
          </p>
        </div>

        {/* Form */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 p-5 sm:p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00B89C]/10 text-[#008F7A]">
              <Gauge size={25} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                Tell us about yourself
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Complete all fields to generate your plan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
            {/* Fitness level */}
            <fieldset className="mb-7">
              <legend className="mb-3 block text-sm font-semibold text-slate-700">
                Your fitness level
              </legend>

              <div className="grid gap-3 sm:grid-cols-3">
                {fitnessLevels.map((level) => {
                  const selected = form.fitnessLevel === level.value;

                  return (
                    <button
                      key={level.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setForm((previous) => ({
                          ...previous,
                          fitnessLevel: level.value,
                        }));
                        setError("");
                        setSuccessMessage("");
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#00B89C] bg-[#00B89C]/5 ring-2 ring-[#00B89C]/10"
                          : "border-slate-200 bg-white hover:border-[#00B89C]/50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">
                          {level.title}
                        </span>

                        {selected && (
                          <CheckCircle2
                            size={19}
                            className="shrink-0 text-[#00B89C]"
                          />
                        )}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {level.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Input fields */}
            <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {fields.map((field) => {
                const Icon = field.icon;

                return (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-semibold text-slate-700"
                    >
                      {field.label}
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#008F7A]">
                        <Icon size={19} />
                      </div>

                      <input
                        id={field.name}
                        className={`${inputClass} pl-12 ${
                          field.suffix ? "pr-16" : ""
                        }`}
                        type="number"
                        name={field.name}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={form[field.name]}
                        onChange={updateField}
                        required
                      />

                      {field.suffix && (
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          {field.suffix}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {field.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
              >
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <p className="font-bold">Unable to generate your plan</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {successMessage && plan && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
              >
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0"
                />
                <p>{successMessage}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#00B89C] px-6 py-4 font-bold text-white shadow-md shadow-[#00B89C]/15 transition hover:bg-[#009F87] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={19} className="animate-spin" />
                  Generating your workout plan...
                </>
              ) : (
                <>
                  <Sparkles size={19} />
                  Generate Workout Plan
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
              <ShieldCheck size={15} className="shrink-0 text-[#008F7A]" />
              Your details are sent to your configured backend API.
            </p>
          </form>
        </section>

        {/* Workout plan result */}
        {plan && (
          <section className="mt-10" aria-live="polite">
            <div className="mb-6 rounded-3xl bg-[#00B89C] p-6 text-white sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles size={25} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                    Your personalized plan
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                    Your Weekly Workout
                  </h2>
                </div>
              </div>

              {plan.summary && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/90 sm:text-base">
                  {plan.summary}
                </p>
              )}
            </div>

            {plan.weeklyPlan.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                The API returned an empty weekly plan. Please try again.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plan.weeklyPlan.map((day, index) => (
                  <article
                    key={`${day.day || "day"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#00B89C]/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                        <Activity size={22} />
                      </div>

                      <span className="rounded-lg bg-[#00B89C]/10 px-3 py-1.5 text-xs font-bold text-[#008F7A]">
                        Day {index + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {day.day || `Day ${index + 1}`}
                    </h3>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {day.activity || "Activity details not provided."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 size={14} />
                          Duration
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {Number(day.durationMinutes) || 0} min
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Gauge size={14} />
                          Intensity
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {day.intensity || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {day.safetyNotes && (
                      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                        {day.safetyNotes}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            {/* General safety notes */}
            {Array.isArray(plan.safetyNotes) &&
              plan.safetyNotes.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ShieldCheck size={21} className="text-[#008F7A]" />
                    Safety Notes
                  </h3>

                  <ul className="mt-4 space-y-3">
                    {plan.safetyNotes.map((note, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                      >
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-[#00B89C]"
                        />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <button
              type="button"
              onClick={resetForm}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Create another plan
            </button>
          </section>
        )}

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <ShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-[#008F7A]"
          />
          <p className="text-xs leading-6 text-slate-500 sm:text-sm">
            <span className="font-bold text-slate-800">
              Fitness disclaimer:{" "}
            </span>
            This plan provides general fitness guidance and is not a substitute
            for medical advice. Increase training gradually, include recovery
            days, and stop exercising if you experience concerning symptoms.
          </p>
        </div>
      </div>
    </main>
  );
}
