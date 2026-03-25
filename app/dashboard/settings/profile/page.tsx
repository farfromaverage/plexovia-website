// Redirect profile settings to onboarding for now
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ProfileSettingsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/onboarding"); }, [router]);
  return null;
}
