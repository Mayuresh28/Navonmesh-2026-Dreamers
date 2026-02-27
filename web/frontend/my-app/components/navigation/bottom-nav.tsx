"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const TABS = [
  { key: "home",    label: "Home",    icon: "🏠", href: "/dashboard" },
  { key: "vitals",  label: "Vitals",  icon: "💗", href: "/dynamic" },
  { key: "dosha",   label: "Dosha",   icon: "🌿", href: "/dashboard/ncm-analysis" },
  { key: "predict", label: "Predict", icon: "🔮", href: "/dashboard/results" },
  { key: "life",    label: "Life",    icon: "🌱", href: "/dashboard/profile" },
] as const;

function activeKey(pathname: string) {
  if (pathname.startsWith("/dashboard/ncm-analysis")) return "dosha";
  if (pathname.startsWith("/dashboard/results"))       return "predict";
  if (pathname.startsWith("/dashboard/profile"))       return "life";
  if (pathname.startsWith("/dynamic"))                 return "vitals";
  return "home";
}

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const current  = activeKey(pathname);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#1a1f36]/95 backdrop-blur-lg border-t border-white/10 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {TABS.map((t) => {
          const active = current === t.key;
          return (
            <button
              key={t.key}
              onClick={() => router.push(t.href)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 ${
                active
                  ? "bg-white/10 ring-2 ring-white/20 scale-105"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-[11px] font-semibold tracking-wide ${
                active ? "text-white" : "text-white/50"
              }`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Sign-out helper usable by any page header */
export async function handleSignOut(router: ReturnType<typeof useRouter>) {
  await signOut(auth);
  router.push("/");
}
