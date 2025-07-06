"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isShowExpired, setIsShowExpired] = useState(false);

    useEffect(() => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem("token");
          setIsShowExpired(true);
          setTimeout(() => router.replace("/login"), 3000);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
        router.replace("/login");
      }
    }, [router]);

    if (isShowExpired) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-600 px-4">
          <div className="bg-white/10 border border-purple-400/30 rounded-2xl p-10 shadow-2xl backdrop-blur-md text-center max-w-md w-full animate-fadeIn">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-purple-300 animate-pulse"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M12 18h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-yellow-200 mb-2">
              Session Expired
            </h1>
            <p className="text-purple-100 text-lg mb-6">
              Your login session is no longer valid. Please log in again to
              continue. 😊
            </p>
            <button
              onClick={() =>router.replace("/login")}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-600">
          <div className="text-center p-8 bg-purple-800/20 backdrop-blur-xl rounded-xl shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-400 border-solid mx-auto mb-6" />
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/logo2.png" alt="App Logo" className="h-12 w-auto" />
              <h1 className="text-3xl font-bold text-purple-200">
                CollaborativeX
              </h1>
            </div>
            <p className="text-purple-100 text-lg font-medium tracking-wide">
              Authenticating Your Session...
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
