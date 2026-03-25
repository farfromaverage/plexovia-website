"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/navigation/nav";

/**
 * Renders the public marketing Nav only on public-facing routes.
 * Hides automatically on /dashboard/* and /auth/* (those sections
 * have their own navigation built into the page component).
 *
 * Also removes the pt-16 offset that compensates for the sticky
 * nav height — not needed on app routes.
 */

const APP_PREFIXES = ["/dashboard", "/auth"];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAppRoute = APP_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <>
      {!isAppRoute && <Nav />}
      <main
        id="main-content"
        className={`flex flex-col flex-1 ${isAppRoute ? "" : "pt-16"}`}
      >
        {children}
      </main>
    </>
  );
}
