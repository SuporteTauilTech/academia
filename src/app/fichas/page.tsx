"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FichasRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/fichas-de-treino");
  }, [router]);

  return null;
}