'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  name: string;
}

interface UserContextType {
  user: User | null;
  setUserName: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const getUserFromToken = (): User | null => {
  if (typeof window === "undefined") return null; // ✅ Prevent SSR crash
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      if (decoded?.name) return { name: decoded.name };
    } catch (err) {
      console.error("Token decoding failed:", err);
      localStorage.removeItem("token");
    }
  }
  return null;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserName] = useState<User | null>(() => getUserFromToken());

  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(getUserFromToken()); // ✅ Re-decode when token changes
    };

    // Listen to localStorage changes (e.g. login/logout in another tab)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
