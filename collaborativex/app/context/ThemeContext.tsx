"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

useEffect(() => {
  const applyTheme = () => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    console.log("Applying theme:", theme, "isDark:", isDark);
    root.classList.toggle("dark", isDark);
    console.log("Current classList:", root.classList.toString());
  };

  applyTheme();

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = () => {
    if (theme === "system") applyTheme();
  };
  mediaQuery.addEventListener("change", handleSystemThemeChange);

  return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
}, [theme]);

  useEffect(() => {
    const fetchTheme = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch("/api/user/profile", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setTheme(userData.preferences?.theme || "system");
          } else {
            console.error("Failed to fetch user profile");
            setTheme("system");
          }
        } catch (err) {
          console.error("Error fetching theme:", err);
          setTheme("system");
        }
      }
    };
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
