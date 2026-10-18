
import axios from "axios";

// API base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Get authentication token
function getAuthToken() {
  return sessionStorage.getItem("token");
}

// Add token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors in one place
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message =
        "Server se connection nahi ho pa raha. Backend check karo.";
    } else {
      const status = error.response.status;
      const serverMessage = error.response.data?.message;

      if (status === 401) {
        // Invalid/expired token or unauthorized request
        sessionStorage.removeItem("token");
      }

      error.message =
        serverMessage ||
        (status === 400
          ? "Invalid request. Input check karo."
          : status === 401
          ? "Session expire ho gaya hai. Dobara login karo."
          : status === 403
          ? "Aapko is action ki permission nahi hai."
          : status === 404
          ? "API endpoint nahi mila."
          : status >= 500
          ? "Backend server mein problem hai."
          : error.message);
    }

    return Promise.reject(error);
  }
);

// -------------------------
// AUTH APIs
// -------------------------

export async function registerUser(data) {
  const response = await api.post("/auth/register", data);

  if (response.data?.token) {
    sessionStorage.setItem("token", response.data.token);
  }

  return response.data;
}

export async function loginUser(data) {
  const response = await api.post("/auth/login", data);

  if (response.data?.token) {
    sessionStorage.setItem("token", response.data.token);
  }

  return response.data;
}

export function logoutUser() {
  sessionStorage.removeItem("token");
  localStorage.removeItem("token");
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

// -------------------------
// WORKOUT / ASSESSMENT APIs
// -------------------------

export async function generateWorkoutPlan(data) {
  const response = await api.post("/assessments", data);
  return response.data;
}

export async function getWorkoutPlans() {
  const response = await api.get("/assessments");
  return response.data;
}

export async function getWorkoutPlanById(id) {
  const response = await api.get(
    `/assessments/${encodeURIComponent(id)}`
  );
  return response.data;
}

// -------------------------
// DASHBOARD API
// -------------------------

export async function getDashboard() {
  const response = await api.get("/dashboard");
  return response.data;
}

// -------------------------
// ACTIVITY APIs
// -------------------------

export async function getActivities(params = {}) {
  const response = await api.get("/activities", { params });
  return response.data;
}

export async function getActivityById(id) {
  const response = await api.get(
    `/activities/${encodeURIComponent(id)}`
  );
  return response.data;
}

export async function addActivity(data) {
  const response = await api.post("/activities", data);
  return response.data;
}

export async function updateActivity(id, data) {
  const response = await api.put(
    `/activities/${encodeURIComponent(id)}`,
    data
  );
  return response.data;
}

export async function deleteActivity(id) {
  const response = await api.delete(
    `/activities/${encodeURIComponent(id)}`
  );
  return response.data;
}

// -------------------------
// RUNNING ROUTES APIs
// -------------------------

export async function getRunningRoutes(params = {}) {
  const response = await api.get("/routes", { params });
  return response.data;
}

export async function getRunningRouteById(id) {
  const response = await api.get(
    `/routes/${encodeURIComponent(id)}`
  );
  return response.data;
}

// -------------------------
// FITNESS COACH API
// -------------------------

export async function askFitnessCoach(message) {
  const response = await api.post("/coach", { message });
  return response.data;
}

// -------------------------
// DEFAULT EXPORT
// -------------------------

export default api;
