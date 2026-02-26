"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) {
      if (user) redirect("/dashboard");
      else redirect("/login");
    }
  }, [user, isLoading]);
  return null;
}
