const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const originalFetch = window.fetch.bind(window);

window.fetch = function patchedFetch(input, init = {}) {
  const withCredentials = {
    ...init,
    credentials: init.credentials || "include",
  };

  if (typeof input === "string" && input.startsWith("/api/") && API_BASE_URL) {
    const rewrittenUrl = `${API_BASE_URL}${input}`;
    alert(`FETCH REWRITE:\n${input}\n->\n${rewrittenUrl}`);
    return originalFetch(rewrittenUrl, withCredentials);
  }

  alert(
    `FETCH NO REWRITE:\nAPI_BASE_URL=${API_BASE_URL}\ninput=${
      typeof input === "string" ? input : input?.url
    }`
  );

  return originalFetch(input, withCredentials);
};
