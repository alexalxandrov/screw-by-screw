const startupFallbackTimer = window.setTimeout(() => {
  if (!document.documentElement.classList.contains("sbs-ready")) {
    document.getElementById("startup-fallback")?.removeAttribute("hidden");
  }
}, 7000);

document.documentElement.addEventListener(
  "sbs-ready",
  () => window.clearTimeout(startupFallbackTimer),
  { once: true }
);
