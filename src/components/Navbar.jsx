
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Activity,
  LayoutDashboard,
  Sparkles,
  Route,
  Bot,
  LogIn,
  UserPlus,
  Home,
  HeartPulse,
  LogOut,
  UserRound,
} from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(sessionStorage.getItem("token"))
  );

  const navigate = useNavigate();

  // Login/logout ke baad Navbar authentication state refresh karega.
  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(Boolean(sessionStorage.getItem("token")));
    };

    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const navLinks = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assessment", label: "AI Planner", icon: Sparkles },
    { to: "/activity", label: "Activity", icon: Activity },
    { to: "/running-routes", label: "Running Routes", icon: Route },
    { to: "/coach", label: "AI Coach", icon: Bot },
  ];

  const desktopLinkClass = ({ isActive }) =>
    `group flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[#00B89C] text-white shadow-sm"
        : "text-slate-600 hover:bg-[#00B89C]/10 hover:text-[#008F7A]"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[#00B89C] text-white shadow-sm"
        : "text-slate-700 hover:bg-[#00B89C]/10 hover:text-[#008F7A]"
    }`;

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setIsLoggedIn(false);
    closeMenu();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NavLink
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3"
          aria-label="FitTrack AI Home"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00B89C] text-white shadow-md shadow-[#00B89C]/20 transition duration-300 group-hover:scale-105">
            <HeartPulse size={25} strokeWidth={2.3} />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              FitTrack
              <span className="text-[#00B89C]"> AI</span>
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 sm:block">
              Your fitness companion
            </span>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={desktopLinkClass}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop Authentication */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {isLoggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#00B89C]/10 hover:text-[#008F7A]"
              >
                <UserRound size={17} />
                My Account
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#00B89C]/10 text-[#008F7A]"
                      : "text-slate-600 hover:bg-[#00B89C]/10 hover:text-[#008F7A]"
                  }`
                }
              >
                <LogIn size={17} />
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-[#00B89C] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#00B89C]/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#009F87] hover:shadow-lg"
              >
                <UserPlus size={17} />
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#00B89C] hover:bg-[#00B89C]/10 hover:text-[#008F7A] xl:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg xl:hidden sm:px-6"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col gap-2"
          >
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMenu}
                className={mobileLinkClass}
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="my-2 border-t border-slate-200" />

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={19} />
                Logout
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  <LogIn size={19} />
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-3 rounded-xl bg-[#00B89C] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#009F87]"
                >
                  <UserPlus size={19} />
                  Create Account
                </NavLink>
              </>
            )}
          </nav>

          <p className="mt-5 text-center text-xs text-slate-500">
            Build healthy habits. One day at a time.
          </p>
        </div>
      )}
    </header>
  );
}