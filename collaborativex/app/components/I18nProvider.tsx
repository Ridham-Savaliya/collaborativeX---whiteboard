// app/components/I18nProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "../lib/i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Ensure i18next is initialized
    if (!i18next.isInitialized) {
      i18next.init();
    }
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
