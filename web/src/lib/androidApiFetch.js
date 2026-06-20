const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const originalFetch = window.fetch.bind(window);

window.fetch = function patchedFetch(input, init) {
  if (
    typeof input === "string" &&
    input.startsWith("/api/") &&
    API_BASE_URL
  ) {
    return originalFetch(`${API_BASE_URL}${input}`, init);
  }

  if (
    input instanceof Request &&
    input.url.includes("://localhost/api/") &&
    API_BASE_URL
  ) {
    const url = new URL(input.url);
    const nextUrl = `${API_BASE_URL}${url.pathname}${url.search}`;

    return originalFetch(
      new Request(nextUrl, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        mode: "cors",
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
      }),
      init
    );
  }

  return originalFetch(input, init);
};
