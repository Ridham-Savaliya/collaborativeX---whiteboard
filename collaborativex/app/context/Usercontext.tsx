'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
// Define the shape of user data
interface User {
    name: string;
}

// Define context value shape
interface UserContextType {
    user: User;
    setUserName: React.Dispatch<React.SetStateAction<User>>;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);




// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserName] = useState<User>({ name: "" });
useEffect(() => {
  if (!user.name) {
    const token = localStorage.getItem('token');

    // 🔒 Check if token exists and is a valid string
    if (typeof token === 'string') {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded?.name) {
          setUserName({ name: decoded.name });
        }
      } catch (err) {
        console.error("Token decoding failed:", err);
        localStorage.removeItem("token"); // optional cleanup
      }
    }
  }
}, []);


    return (
        <UserContext.Provider value={{ user, setUserName }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use the context
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
