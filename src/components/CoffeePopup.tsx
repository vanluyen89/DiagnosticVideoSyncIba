import { useEffect, useState } from 'react';
import { COFFEE_POPUP_EVENT } from '@/utils/coffeePopup';

const AUTO_DISMISS_MS = 20_000;
const COFFEE_URL = 'https://buymeacoffee.com/vanluyen89';

export function CoffeePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsVisible(true);
    window.addEventListener(COFFEE_POPUP_EVENT, handleShow);
    return () => window.removeEventListener(COFFEE_POPUP_EVENT, handleShow);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = window.setTimeout(
      () => setIsVisible(false),
      AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <aside
      className="coffee-popup border-surface-700 bg-surface-900 fixed right-4 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border p-4 shadow-2xl shadow-black/40 sm:right-6 sm:bottom-6"
      role="status"
      aria-live="polite"
      aria-label="Support the app"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Enjoying the app? ☕
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                If this tool saved you some time, you can support its
                development with a coffee. Thank you!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="-mt-1 -mr-1 shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none"
              aria-label="Close support message"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>

          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center rounded-lg bg-[#ffdd00] px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-[#ffe433] focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
          >
            Buy me a coffee
          </a>
        </div>

        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl bg-white p-1.5 transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          aria-label="Open Buy Me a Coffee page"
        >
          <img
            src="/buy-me-a-coffee-vanluyen89.png"
            alt="QR code for Buy Me a Coffee"
            className="h-24 w-24 rounded-lg sm:h-28 sm:w-28"
          />
        </a>
      </div>
      <div className="coffee-popup-timer absolute right-0 bottom-0 left-0 h-0.5 bg-amber-300/70" />
    </aside>
  );
}
