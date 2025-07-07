"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useToast } from "../utills/ToastProvider";


const AuthPage = () => {
  const router = useRouter();
  const { navigateWithLoader } = useGlobalLoader();
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  const [isLoading, setIsLoading] = useState(false);
  const [isForgetPwd, setIsForgetPwd] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [step, setStep] = useState(1);
  const {showToast} = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const [otpDetails, setOtpDetails] = useState({
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpDetails((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {

    
  }, [])


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { email, password, confirmPassword, name } = formData;
    const postRegister = new URLSearchParams(window.location.search).get('postRegister');
    console.log(postRegister)

    if (password !== confirmPassword) {

      showToast("Passwords do not match","error")
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/auth/register", {
        email,
        password,
        name,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);



      if (postRegister) {
        navigateWithLoader(router, postRegister);
      }
      else {
        navigateWithLoader(router, '/onboarding');
      }

      // toast.success("Registered successfully!");
      showToast("Registered successfully!","success");

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { email, password } = formData;

    try {
      const res = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      // toast.success(res.data.message);
      showToast(res.data.message)
      
      navigateWithLoader(router, "/onboarding"); // 
    } catch (error: any) {

      showToast(error.response?.data?.message || "Login failed","error")
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (step === 1) {
        const res = await axios.post("/api/auth/forget-password", {
          email: formData.email,
        });

        showToast(res.data?.message,"success")
        setOtpId(res.data?.otpId);
        setStep(2);
      } else {
        if (otpDetails.newPassword !== otpDetails.confirmNewPassword) {

          showToast("Passwords do not match","warning")
          return;
        }

        const res = await axios.post("/api/auth/verify-otp", {
          otpId,
          verificationCode: otpDetails.otp,
          newPassword: otpDetails.newPassword,
          cPassword: otpDetails.confirmNewPassword,
        });


        showToast(res.data?.message || "Password reset successful!","success")
        setIsForgetPwd(false);
        setStep(1);
      }
    } catch (error: any) {

      showToast(error?.response?.data?.message || "Reset failed","error")
    } finally {
      setIsLoading(false);
    }
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
        <div className="absolute opacity-80"></div>
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

          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-6"
          >
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? isLogin
                  ? "Logging in..."
                  : "Registering..."
                : isLogin
                  ? "Sign In"
                  : "Sign Up"}
            </button>
          </form>

          {isLogin && (
            <div className="text-center">
              <button
                onClick={() => setIsForgetPwd(true)}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgetPwd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-[var(--background)] rounded-xl p-8 shadow-2xl relative w-full max-w-md transform transition-all duration-300 scale-100 hover:scale-[1.02]">
            <button
              onClick={() => {
                setIsForgetPwd(false);
                setStep(1);
                setOtpDetails({
                  otp: "",
                  newPassword: "",
                  confirmNewPassword: "",
                });
              }}
              className="absolute top-4 right-4 text-xl font-bold text-[var(--text)] hover:text-[var(--primary)] transition-colors"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
              {step === 1
                ? "Reset Your Password"
                : "Enter OTP and New Password"}
            </h3>
            <form onSubmit={handleResetSubmit} className="space-y-5">
              {step === 1 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your registered email"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                    required
                  />
                </div>
              )}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      OTP
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={otpDetails.otp}
                      onChange={handleOtpChange}
                      placeholder="Enter OTP"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={otpDetails.newPassword}
                      onChange={handleOtpChange}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={otpDetails.confirmNewPassword}
                      onChange={handleOtpChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--glass-bg)] border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition-all duration-200"
                      required
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Processing..."
                  : step === 1
                    ? "Send OTP"
                    : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
