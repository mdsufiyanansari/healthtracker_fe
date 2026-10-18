
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  HeartPulse,
  ShieldCheck,
  Dumbbell,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  Target,
  CheckCircle2,
} from "lucide-react";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      });

      const token =
        result?.token ||
        result?.accessToken ||
        result?.data?.token ||
        result?.data?.accessToken;

      if (!token) {
        setError(
          result?.message ||
            "Login succeeded without a token. Please check your backend response."
        );
        return;
      }

      const redirectTo = location.state?.from?.pathname || "/home";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F8F9] px-4 py-5 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-8">
      <div className="mx-auto grid min-h-[650px] w-full max-w-6xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10 lg:grid-cols-2">

        {/* LEFT BRAND PANEL */}
        <section className="relative isolate hidden overflow-hidden bg-gradient-to-br from-[#009F70] via-[#009B83] to-[#007C91] px-10 py-10 text-white sm:px-12 lg:flex lg:flex-col xl:px-14">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-emerald-300/15" />
          <div className="pointer-events-none absolute right-16 top-1/2 -z-10 h-40 w-40 rounded-full bg-cyan-300/5 blur-2xl" />

          {/* Brand */}
          <Link to="/" className="flex w-fit items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/10 backdrop-blur">
              <Activity size={29} strokeWidth={2.3} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              FitTrack
              <span className="text-emerald-100"> AI</span>
            </span>
          </Link>

          {/* Main heading */}
          <div className="relative mt-12 xl:mt-14">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide">
              <HeartPulse size={16} />
              Your fitness journey starts here
            </div>

            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.2] tracking-tight xl:text-[46px]">
              Build healthy habits.
              <br />
              Become your best self.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-emerald-50/95 sm:text-base">
              Track your activity, discover personalized workout plans, and
              work toward your fitness goals one day at a time.
            </p>
          </div>

          {/* Features */}
          <div className="mt-9 space-y-5">
            {[
              {
                icon: ShieldCheck,
                text: "Track your daily fitness activities",
              },
              {
                icon: Dumbbell,
                text: "Explore personalized workout plans",
              },
              {
                icon: Target,
                text: "Monitor your progress over time",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon size={17} />
                  </span>
                  <span className="text-sm font-medium text-white/95">
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-10 text-xs tracking-wide text-emerald-50/90">
            Small steps today. Stronger you tomorrow.
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <Link to="/" className="mb-9 flex w-fit items-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#009B6B]">
                <Activity size={24} />
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                FitTrack <span className="text-[#009B6B]">AI</span>
              </span>
            </Link>

            {/* Form heading */}
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#009B6B]">
                <Dumbbell size={27} strokeWidth={2.1} />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[32px]">
                Welcome back!
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue your fitness journey.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="group relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#009B6B]"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#009B6B] focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#009B6B] transition hover:text-[#007C55]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="group relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#009B6B]"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#009B6B] focus:ring-4 focus:ring-emerald-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 cursor-pointer accent-[#009B6B]"
                />
                Remember me
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B6B] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition duration-200 hover:bg-[#00865D] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#009B6B] transition hover:text-[#007C55]"
              >
                Create account
              </Link>
            </p>

            {/* Footer */}
            <div className="mt-9 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} />
              <span>Your fitness journey, your progress.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
