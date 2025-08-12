"use client";

import React, { useEffect } from "react";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { usePathname } from "next/navigation";

const GlobalLoader = () => {
  const { isLoading, hideLoader } = useGlobalLoader();
  const pathname = usePathname();

  // Automatically hide the loader when pathname changes (navigation completed)
  useEffect(() => {
    if (isLoading) {
      hideLoader();
    }
  }, [pathname]); // Every time the path changes, hide the loader

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-purple-500 animate-pulse z-[9999]" />
  );
};

export default GlobalLoader;
