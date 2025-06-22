import { useEffect } from "react";

export const useUnsavedChangesWarning = (shouldWarn = false) => {
  useEffect(() => {
    const handleBeforeUnload = (e:any) => {
      if (!shouldWarn) return;

      e.preventDefault();
      e.returnValue = ""; // Required for Chrome to show the warning
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn]);
};
