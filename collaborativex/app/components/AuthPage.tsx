"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

const AuthPage = () => {
  const router = useRouter();
  const [IsLoading, setIsLoading] = useState(false)
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)
    const { email, password, name } = formData;
    try {
      const res = await axios.post("/api/auth/register", {
        email,
        password,
        name,
      });
      localStorage.setItem("token", res.data.token);
      toast.success('you are registered with CollaborativeX!') 

      router.push("/");
      console.log("Form submitted:", formData);
    } catch (error: any) {
      console.error(
        error.response?.data?.message || "An error occurred while registering"
      );
    }
    finally{
      setIsLoading(false)
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)
    const {email,password} = formData;

    try {
      
      const res = await axios.post('/api/auth/login',
        {email,password}
      )
      
      localStorage.setItem("token", res.data.token);
      toast.success(res.data.message)
      router.push('/')

    } catch (error : any) {
    toast.error(error.response?.data?.message || 'Failed to login!'); 
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src={
            isLogin
              ? "/Ethereal Silhouette in Purple.jpeg"
              : "/Pastel Cosmetic Display.jpeg"
          }
          alt={isLogin ? "Login Background" : "Register Background"}
          layout="fill"
          objectFit="cover"
          priority
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute  opacity-80"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
            {isLogin ? "Welcome Back!" : "Join CollaborativeX"}
          </h1>
          <p className="text-xl text-center max-w-md opacity-90">
            {isLogin
              ? "Log in to continue your journey with CollaborativeX"
              : "Create an account to start collaborating with your team"}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--background)]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold gradient-text mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-[var(--text)] opacity-70">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => router.push(isLogin ? "/register" : "/login")}
                className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-semibold transition-colors"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[var(--text)] mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--primary-light)] border-opacity-20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text)] mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--primary-light)] border-opacity-20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--primary-light)] border-opacity-20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 transition-all"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[var(--text)] mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--primary-light)] border-opacity-20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 transition-all"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={IsLoading}
              className="w-full interactive-button bg-[var(--primary)] text-white py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-semibold"
            >
              {IsLoading ? isLogin ? "Logging..." : "Registering..." : isLogin ? "Sign In" : "Sign Up"}

            </button>
          </form>

          {isLogin && (
            <div className="text-center">
              <a
                href="#"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
