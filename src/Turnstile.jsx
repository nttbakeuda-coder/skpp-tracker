import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "./config.js";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    let s = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (s) {
      s.addEventListener("load", () => resolve());
      s.addEventListener("error", reject);
      return;
    }
    s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", reject);
    document.head.appendChild(s);
  });
}

// Widget CAPTCHA Cloudflare Turnstile. Bila TURNSTILE_SITE_KEY kosong (mis. saat
// uji staging sebelum Turnstile diaktifkan) komponen tidak menampilkan apa pun —
// pemanggil menganggap CAPTCHA tidak diwajibkan.
export function Turnstile({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => onToken?.(token),
          "expired-callback": () => onToken?.(""),
          "error-callback": () => onToken?.(""),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* abaikan */
        }
      }
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} style={{ marginTop: 4 }} />;
}
