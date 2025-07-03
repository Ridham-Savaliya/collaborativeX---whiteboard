"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import dotenv from "dotenv";
dotenv.config();

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      try {
        const token = localStorage.getItem("token");
        console.log(token);

        if (!token) {
          router.replace("/login");
        } else if (token) {
          const decoded = jwtDecode(token); // ✅ just decode, don't verify
          const isExpired = decoded.exp * 1000 < Date.now();
          if (isExpired) {
            localStorage.removeItem("token");
            router.replace("/login");
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Invalid token", err);
        router.replace("/login");
      }
    }, [router]);

    if (isLoading) {
      return React.createElement(
        "div",
        {
          className:
            "flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-600",
        },
        React.createElement(
          "div",
          {
            className:
              "text-center p-8 bg-purple-800/20 backdrop-blur-xl rounded-xl shadow-2xl",
          },
          React.createElement("div", {
            className:
              "animate-spin rounded-full h-16 w-16 border-t-4 border-purple-400 border-solid mx-auto mb-6",
          }),
          React.createElement(
            "div",
            { className: "flex items-center justify-center gap-4 mb-4" },
            React.createElement("img", {
              src: "/logo2.png",
              alt: "App Logo",
              className: "h-12 w-auto",
            }),
            React.createElement(
              "h1",
              { className: "text-3xl font-bold text-purple-200" },
              "CollaborativeX"
            )
          ),
          React.createElement(
            "p",
            { className: "text-purple-100 text-lg font-medium tracking-wide" },
            "Authenticating Your Session..."
          )
        )
      );
    }

    return React.createElement(Component, props);
  };
}
