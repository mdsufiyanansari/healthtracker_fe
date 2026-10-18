
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  User,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { registerUser, loginUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      // 1) Create the account.
      const registration = await registerUser({
        name,
        email,
        password: form.password,
      });

      // 2) If registration did not return a JWT, log in immediately.
      // loginUser() stores a top-level response.data.token via api.js.
      let token =
        registration?.token ||
        registration?.accessToken ||
        registration?.data?.token ||
        sessionStorage.getItem("token");

      if (!token) {
        // Remove any stale token before authenticating the new account.
        sessionStorage.removeItem("token");
        const loginResult = await loginUser({
          email,
          password: form.password,
        });

        token =
          loginResult?.token ||
          loginResult?.accessToken ||
          loginResult?.data?.token ||
          sessionStorage.getItem("token");
      }

      if (!token) {
        throw new Error(
          "Account created, but the server did not return an authentication token. Please check the login API response."
        );
      }

      // 3) Ensure the token is stored before navigating to Home.
      sessionStorage.setItem("token", token);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        err.response?.data?.error;

      if (!err.response && err.message) {
        setError(err.message);
      } else if (!err.response) {
        setError("Cannot connect to server. Please check your backend.");
      } else if (status === 409) {
        setError(message || "This email is already registered.");
      } else if (status === 400 || status === 422) {
        setError(message || "Please check your details and try again.");
      } else {
        setError(message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <Activity size={32} />
            <span className="text-2xl font-bold">FitTrack</span>
          </Link>

          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Start your fitness journey.
            </h1>

            <p className="mt-5 leading-7 text-white/85">
              Create your account to organize workouts, track activities,
              and monitor your fitness progress.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              <li>✓ Personalized workout planning</li>
              <li>✓ Activity and progress tracking</li>
              <li>✓ Fitness guidance in one place</li>
            </ul>
          </div>

          <p className="text-sm text-white/75">
            Small steps today. Stronger you tomorrow.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-7 inline-flex items-center gap-2 text-xl font-bold text-emerald-700"
            >
              <Activity size={27} />
              <span className="lg:hidden">FitTrack</span>
            </Link>

            <h2 className="text-3xl font-bold text-gray-900">
              Create account
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Join FitTrack and build healthier habits.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={254}
                    required
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={128}
                    required
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={128}
                    required
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-1 accent-emerald-600"
                />

                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="text-emerald-700 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-emerald-700 hover:underline">
                    Privacy Policy
                  </Link>.
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
