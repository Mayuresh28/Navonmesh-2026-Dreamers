"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Activity, Leaf, HeartPulse, User } from "lucide-react";
import { FloatingDock, type DockItem } from "@/components/ui/floating-dock";

/* ── Tab accent colors — contrasting, not all green ── */
const TABS = [
  { key: "result",   label: "Result",   Icon: Activity,   href: "/dashboard",          accent: "#4a9eff" },   // blue
  { key: "remedies", label: "Remedies", Icon: Leaf,       href: "/dashboard/remedies",  accent: "#0de5a8" },   // teal-green
  { key: "dynamic",  label: "Dynamic",  Icon: HeartPulse, href: "/dynamic",             accent: "#ff607a" },   // coral-red
  { key: "profile",  label: "Profile",  Icon: User,       href: "/dashboard/profile",   accent: "#ffb83f" },   // amber
] as const;

function activeKey(pathname: string) {
  if (pathname.startsWith("/dashboard/remedies")) return "remedies";
  if (pathname.startsWith("/dashboard/profile"))  return "profile";
  if (pathname.startsWith("/dynamic"))            return "dynamic";
  return "result";
}

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const current  = activeKey(pathname);

  const items: DockItem[] = TABS.map((t) => ({
    title: t.label,
    icon: <t.Icon className="w-full h-full" style={{ color: current === t.key ? t.accent : "var(--text-faint)" }} />,
    onClick: () => router.push(t.href),
    active: current === t.key,
    accentColor: t.accent,
  }));

  return <FloatingDock items={items} />;
}

/** Sign-out helper usable by any page header */
export async function handleSignOut(router: ReturnType<typeof useRouter>) {
  await signOut(auth);
  router.push("/");
}
