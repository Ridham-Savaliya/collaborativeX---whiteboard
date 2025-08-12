// hooks/useGlobalLoader.ts
"use client";

import { createContext, useContext, useState } from "react";

interface LoaderContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
  navigateWithLoader: (router: any, path: string) => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  const navigateWithLoader = (router: any, path: string) => {
    showLoader();
    router.push(path);
  };

  return (
    <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader, navigateWithLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useGlobalLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within a LoaderProvider");
  }
  return context;
};
