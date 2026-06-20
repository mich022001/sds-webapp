const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const originalFetch = window.fetch.bind(window);

window.fetch = function patchedFetch(input, init = {}) {
  const withCredentials = {
    ...init,
    credentials: init.credentials || "include",
  };

  if (
    typeof input === "string" &&
    input.startsWith("/api/") &&
    API_BASE_URL
  ) {
    return originalFetch(`${API_BASE_URL}${input}`, withCredentials);
  }

  return originalFetch(input, withCredentials);
};
