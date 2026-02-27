"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home, HeartPulse, Leaf, Sparkles, User, FlaskConical } from "lucide-react";

const TABS = [
  { key: "home",     label: "Home",     icon: Home,         href: "/dashboard" },
  { key: "vitals",   label: "Vitals",   icon: HeartPulse,   href: "/dynamic" },
  { key: "dosha",    label: "Dosha",    icon: Leaf,         href: "/dashboard/ncm-analysis" },
  { key: "remedies", label: "Remedies", icon: FlaskConical, href: "/dashboard/remedies" },
  { key: "predict",  label: "Predict",  icon: Sparkles,     href: "/dashboard/results" },
  { key: "life",     label: "Life",     icon: User,         href: "/dashboard/profile" },
] as const;

function activeKey(pathname: string) {
  if (pathname.startsWith("/dashboard/ncm-analysis")) return "dosha";
  if (pathname.startsWith("/dashboard/remedies"))     return "remedies";
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
    <nav className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-xl safe-bottom"
      style={{
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--border)",
      }}>
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1.5">
        {TABS.map((t) => {
          const active = current === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => router.push(t.href)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-2xl transition-all duration-200"
              style={{
                background: active ? "var(--teal-bg)" : "transparent",
                boxShadow: active ? "0 0 0 2px var(--border-accent)" : "none",
                transform: active ? "scale(1.05)" : "scale(1)",
              }}
            >
              <Icon className="w-5 h-5" style={{
                color: active ? "var(--teal)" : "var(--text-faint)"
              }} />
              <span className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? "var(--teal)" : "var(--text-faint)" }}>
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
