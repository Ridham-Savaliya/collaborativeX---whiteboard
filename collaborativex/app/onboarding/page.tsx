"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  Star,
  X,
  Users,
  Target,
  Compass,
  Loader2,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import withAuth from "../api/_lib/withAuth";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useToast } from "../utills/ToastProvider";
import axios from "axios";
import ShareInterface from "../components/ShareQrCode";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Whiteboard {
  _id: string;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  purpose?: string;
  collaborators?: string[];
}

interface User {
  userId: string;
  email: string;
  isOnboarded: boolean;
}

const Onboarding = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { navigateWithLoader } = useGlobalLoader();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    name: "",
    purpose: "",
    collaborators: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);


  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded: any = jwtDecode(storedToken);
        const userId = decoded.userId;
        fetchUserData(userId, storedToken);
      } catch (e) {
        console.error(t("errors.decodeToken"), e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router, t]);

  const fetchUserData = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/user/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser({ userId, isOnboarded: userData.isOnboarded, email: userData.email });
        setIsOnboarding(!userData.isOnboarded);
      } else {
        console.error(t("errors.fetchUserData"));
        router.push("/login");
      }
    } catch (e) {
      console.error(t("errors.fetchUserData"), e);
      router.push("/login");
    }
  };

  // useEffect(() => {
  //   const sendWelcomeMail = async () => {
  //     const token = localStorage.getItem('token');
  //     try {
  //       const res = await axios.post(
  //         "/api/user/welcomeMail",
  //         {},
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  //       if (res.status === 200) {
  //         console.log(res.data.message);
  //       }
  //     } catch (err) {
  //       console.error("Failed to send welcome mail:", err);
  //     }
  //   };

  //   const timer = setTimeout(() => {
  //     sendWelcomeMail();
  //   }, 4000);

  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    const createQRcodeAndLink = async () => {
      if (!whiteboardId || !user?.email || !token) return;

      setIsGeneratingLink(true);
      try {
        const res = await axios.post(
          '/api/whiteboard/lnvitelink',
          { whiteboardId, owner: user.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInviteLink(res.data.inviteLink);
        console.log('Invite link generated:', res.data.inviteLink);
      } catch (err) {
        console.error('Failed to create invite link:', err);
        showToast('Failed to generate invite link', 'error');
      } finally {
        setIsGeneratingLink(false);
      }
    };

    createQRcodeAndLink();
  }, [whiteboardId, user?.email, token, showToast]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (token) {
      fetchWhiteboards(page);
    }
  }, [page, token]);

  const [totalPage, setTotalPage] = useState(0);
  const [limit, setLimit] = useState(12);
  const [totalDocs, setTotalDocs] = useState(0);

  const fetchWhiteboards = async (page?: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/whiteboard?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWhiteboards(Array.isArray(data.whiteboards) ? data.whiteboards : []);
        setTotalDocs(data?.totalDocs);
        setTotalPage(data?.totalPage);
        setPage(data?.page);
        showToast("Whiteboards loaded!", "success");
      } else {
        console.error(t("errors.fetchWhiteboards"));
        setWhiteboards([]);
      }
    } catch (e) {
      console.error(t("errors.fetchWhiteboards"), e);
      setWhiteboards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (page < totalPage) setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const toggleFavorite = async (id: string) => {
    try {
      const response = await fetch("/api/whiteboard/makeAsFavorite", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ whiteboardId: id }),
      });
      if (response.ok) {
        setWhiteboards(
          whiteboards.map((board) =>
            board._id === id
              ? { ...board, isFavorite: !board.isFavorite }
              : board
          )
        );
        showToast("You made it favorite!", "success");
      }
    } catch (e) {
      console.error(t("errors.toggleFavorite"), e);
    }
  };

  const deleteWhiteboard = async (id: string) => {
    if (window.confirm(t("deleteWhiteboardConfirm"))) {
      try {
        const response = await fetch("/api/whiteboard", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ whiteboardId: id }),
        });
        if (response.ok) {
          setWhiteboards(whiteboards.filter((board) => board._id !== id));
          showToast('You just deleted a whiteboard!', "success");
        }
      } catch (e) {
        console.error(t("errors.deleteWhiteboard"), e);
      }
    }
  };

  const handleOnboardingNext = async () => {
    if (onboardingStep === 1 && !onboardingData.name.trim()) return;
    if (onboardingStep === 2 && !onboardingData.purpose) return;

    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      try {
        const response = await fetch("/api/whiteboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: onboardingData.name,
            purpose: onboardingData.purpose,
            collaborators: onboardingData.collaborators
              ? onboardingData.collaborators
                .split(",")
                .map((email) => email.trim())
              : [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newWhiteboard = data.whiteboard || data;
          if (newWhiteboard._id) {
            setWhiteboards([newWhiteboard, ...whiteboards]);
            setWhiteboardId(newWhiteboard._id);
            setOnboardingStep(onboardingStep + 1); // Move to step 4 (sharing)
          } else {
            console.error(t("errors.whiteboardIdNotFound"), data);
            showToast(t("errors.createWhiteboard"), "error");
          }
        } else {
          console.error(t("errors.createWhiteboard"), response.statusText);
          showToast(t("errors.createWhiteboard"), "error");
        }
      } catch (e) {
        console.error(t("errors.createWhiteboard"), e);
        showToast(t("errors.genericError"), "error");
      }
    }
  };

  const handleContinueToWhiteboard = () => {
    if (whiteboardId) {
      // Reset onboarding state
      setOnboardingStep(1);
      setOnboardingData({ name: "", purpose: "", collaborators: "" });
      setWhiteboardId(null);
      setInviteLink(null);
      setIsOnboarding(false);

      // Navigate to the whiteboard
      navigateWithLoader(router, `/whiteboard/${whiteboardId}`);
    }
  };

  const filteredWhiteboards = Array.isArray(whiteboards)
    ? whiteboards
      .filter((board) =>
        board.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((board) => !showFavoritesOnly || board.isFavorite)
    : [];

  const LoadingSkeleton = () => {
    return (
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            : "flex flex-col gap-4"
        }
      >
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-gray-700 overflow-hidden ${view === "grid" ? "p-8" : "p-6 flex items-center"
              }`}
          >
            <div className="animate-pulse space-y-4 w-full">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-grow">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded-full w-1/2"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded-full w-1/3"></div>
              </div>
              {view === "grid" && (
                <div className="flex items-center mt-4">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded-full w-1/4"></div>
                </div>
              )}
              <div
                className={`${view === "grid"
                  ? "absolute inset-x-0 bottom-0 p-4"
                  : "flex items-center gap-3 p-4"
                  }`}
              >
                <div className="h-10 bg-gradient-to-r from-indigo-500/20 dark:from-indigo-400/20 to-purple-500/20 dark:to-purple-400/20 rounded-xl w-full"></div>
                <div className="h-10 bg-gradient-to-r from-red-500/20 dark:from-red-600/20 to-pink-500/20 dark:to-pink-600/20 rounded-xl w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 dark:from-gray-900 via-blue-50 dark:via-gray-800 to-indigo-100 dark:to-gray-900 p-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 dark:from-purple-700/10 to-pink-400/20 dark:to-pink-700/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 dark:from-blue-700/10 to-cyan-400/20 dark:to-cyan-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-4xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 p-10 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                if (onboardingStep > 1) {
                  setOnboardingStep(onboardingStep - 1);
                } else {
                  setIsOnboarding(false);
                }
              }}
              className="p-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft
                size={24}
                className="text-gray-600 dark:text-gray-300"
              />
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 bg-clip-text text-transparent">
                {onboardingStep === 4 ? "Share Your Whiteboard" : t("createWhiteboard")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {onboardingStep === 4 ? "Step 4 of 4" : t("stepNof3", { n: onboardingStep })}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOnboarding(false);
                setOnboardingStep(1);
                setOnboardingData({ name: "", purpose: "", collaborators: "" });
                setWhiteboardId(null);
                setInviteLink(null);
              }}
              className="p-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex justify-center mb-10">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step === onboardingStep
                      ? "bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 text-white shadow-lg scale-110"
                      : step < onboardingStep
                        ? "bg-gradient-to-r from-green-500 dark:from-green-600 to-emerald-500 dark:to-emerald-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      }`}
                  >
                    {step < onboardingStep ? "✓" : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${step < onboardingStep
                        ? "bg-gradient-to-r from-green-500 dark:from-green-600 to-emerald-500 dark:to-emerald-600"
                        : "bg-gray-200 dark:bg-gray-600"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {onboardingStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 to-purple-100 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target
                      size={28}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                    {t("nameYourWhiteboard")}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {t("nameYourWhiteboardDesc")}
                  </p>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={onboardingData.name}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        name: e.target.value,
                      })
                    }
                    placeholder={t("exampleWhiteboardName")}
                    className="w-full px-6 py-4 rounded-2xl text-[#8028f9] border-2 border-gray-200 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 text-lg placeholder-gray-400 dark:placeholder-gray-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 dark:from-purple-900/20 to-pink-100 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass
                      size={28}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                    {t("chooseYourPurpose")}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {t("chooseYourPurposeDesc")}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      value: "Team Brainstorm",
                      label: t("teamBrainstorm"),
                      desc: t("teamBrainstormDesc"),
                      icon: "💡",
                    },
                    {
                      value: "Project Planning",
                      label: t("projectPlanning"),
                      desc: t("projectPlanningDesc"),
                      icon: "📋",
                    },
                    {
                      value: "Design Sprint",
                      label: t("designSprint"),
                      desc: t("designSprintDesc"),
                      icon: "🎨",
                    },
                    {
                      value: "Strategy Session",
                      label: t("strategySession"),
                      desc: t("strategySessionDesc"),
                      icon: "📚",
                    },
                    {
                      value: "Other",
                      label: t("otherPurpose"),
                      desc: t("otherPurposeDesc"),
                      icon: "⚡",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setOnboardingData({
                          ...onboardingData,
                          purpose: option.value,
                        })
                      }
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-105 ${onboardingData.purpose === option.value
                        ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Semi-blurred container area */}
                <div className="w-[600px] rounded-3xl bg-white/20 dark:bg-black/30 backdrop-blur-md border border-gray-300 dark:border-gray-700 shadow-xl p-8 text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users
                      size={28}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {t("inviteCollaborators")}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-gray-600 dark:text-gray-400 text-base mb-4">
                    {t("inviteCollaboratorsDesc")}
                  </p>

                  {/* Disabled Input */}
                  <input
                    disabled
                    type="text"
                    value={onboardingData.collaborators}
                    placeholder={t("exampleCollaborators")}
                    className="w-full px-6 py-4 rounded-xl text-[#8028f9] border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-white/10 text-lg placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed"
                  />

                  {/* Small Tip */}
                  <p
                    className="text-sm text-gray-500 dark:text-gray-400 mt-3"
                    dangerouslySetInnerHTML={{ __html: t("separateEmailsTip") }}
                  />

                  {/* Not Supported Banner */}
                  <div className="mt-6 text-red-600 dark:text-red-400 text-sm font-semibold">
                    ⚠️ This feature has been discontinued. You can invite collaborators using the shareable link or QR code.                    </div>
                </div>
              </div>
            )}


            {onboardingStep === 4 && (
              <div className="animate-fade-in">
                <ShareInterface
                  inviteLink={inviteLink}
                  whiteboardName={onboardingData.name}
                  onContinue={handleContinueToWhiteboard}
                />
              </div>
            )}
          </div>

          {onboardingStep < 4 && (
            <div className="mt-10 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {onboardingStep === 3
                  ? t("readyToCreate")
                  : t("stepsRemaining", { n: 3 - onboardingStep })}
              </div>
              <button
                onClick={handleOnboardingNext}
                disabled={
                  (onboardingStep === 1 && !onboardingData.name.trim()) ||
                  (onboardingStep === 2 && !onboardingData.purpose)
                }
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-200 ${(onboardingStep === 1 && !onboardingData.name.trim()) ||
                  (onboardingStep === 2 && !onboardingData.purpose)
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 hover:from-indigo-700 dark:hover:from-indigo-300 hover:to-purple-700 dark:hover:to-purple-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
              >
                <span className="text-lg">
                  {onboardingStep === 3 ? t("createWhiteboard") : t("continue")}
                </span>
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 dark:from-gray-900 via-blue-50 dark:via-gray-800 to-indigo-100 dark:to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 dark:from-purple-700/5 to-pink-400/10 dark:to-pink-700/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 dark:from-blue-700/5 to-cyan-400/10 dark:to-cyan-700/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/5 dark:from-indigo-700/5 to-purple-400/5 dark:to-purple-700/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">C</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 bg-clip-text text-transparent">
                  {t("collaborativeX")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {t("creativeWorkspaceDashboard")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-600">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${showFavoritesOnly
                    ? "bg-gradient-to-r from-amber-500 dark:from-amber-600 to-orange-500 dark:to-orange-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  aria-label={t("showFavoritesOnly")}
                >
                  <Star
                    size={20}
                    className={showFavoritesOnly ? "fill-white" : ""}
                  />
                </button>

                <button
                  onClick={() => setView(view === "grid" ? "list" : "grid")}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-white-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                  aria-label={t("toggleView")}
                >
                  <LayoutGrid size={20} />
                </button>
              </div>

              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="text"
                  placeholder={t("searchWhiteboardsPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-4 rounded-2xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-white/20 dark:border-gray-600 focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white/80 dark:focus:bg-gray-700/80 w-full lg:w-80 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <button
                onClick={() => setIsOnboarding(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 hover:from-indigo-700 dark:hover:from-indigo-300 hover:to-purple-700 dark:hover:to-purple-300 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-semibold"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">{t("newWhiteboard")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10">
        l          {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 to-purple-100 dark:to-purple-900/20 rounded-3xl flex items-center justify-center shadow-2xl">
                <Loader2
                  className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 dark:from-purple-600 to-pink-500 dark:to-pink-600 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-500 dark:from-blue-600 to-cyan-500 dark:to-cyan-600 rounded-full animate-pulse delay-500"></div>
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                {t("loadingYourWhiteboards")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t("loadingYourWhiteboardsDesc")}
              </p>
            </div>
            <LoadingSkeleton />
          </div>
        ) : filteredWhiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 to-purple-100 dark:to-purple-900/20 rounded-3xl flex items-center justify-center shadow-2">
                <Compass
                  size={56}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 dark:from-purple-600 to-pink-500 dark:to-pink-600 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-500 dark:from-blue-600 to-cyan-500 dark:to-cyan-600 rounded-full animate-pulse delay-500"></div>
            </div>
            {searchTerm ? (
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                  {t("noMatchesFound")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {t("noMatchesFoundDesc")}
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-all duration-200 font-medium"
                >
                  {t("clearSearch")}
                </button>
              </div>
            ) : (
              <div className="text-center max-w-2xl">
                <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  {t("startYourCreativeJourney")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-xl mb-8 leading-relaxed">
                  {t("startYourCreativeJourneyDesc")}
                </p>
                <button
                  onClick={() => setIsOnboarding(true)}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 dark:hover:from-indigo-300 hover:to-purple-700 dark:hover:to-purple-300 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 text-lg font-semibold"
                >
                  <Plus size={24} />
                  <span>{t("createYourFirstWhiteboard")}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                : "flex flex-col gap-4"
            }
          >
            {filteredWhiteboards.map((whiteboard, index) => (
              <div
                key={whiteboard._id}
                className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow-2xl overflow-hidden animate-fade-in ${view === "grid"
                  ? "shadow-lg hover:shadow-2xl"
                  : "shadow-md hover:shadow-xl flex items-center"
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {view === "grid" && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 dark:from-indigo-400 to-purple-500 dark:to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}

                <div
                  className={`${view === "grid" ? "p-8" : "p-6 flex-grow"}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow">
                      <h2
                        className={`font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 ${view === "grid" ? "text-xl mb-3" : "text-lg mb-2"
                          }`}
                      >
                        {whiteboard.name}
                      </h2>
                      {whiteboard.purpose && (
                        <span className="inline-block text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-600/50">
                          {t(
                            whiteboard.purpose
                              .toLowerCase()
                              .replace(/\s/g, "")
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(whiteboard._id);
                      }}
                      className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 ${whiteboard.isFavorite
                        ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                        : "text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        }`}
                      aria-label={
                        whiteboard.isFavorite
                          ? t("removeFromFavorites")
                          : t("addToFavorites")
                      }
                    >
                      <Star
                        size={18}
                        className={
                          whiteboard.isFavorite
                            ? "fill-amber-500 dark:fill-amber-400"
                            : ""
                        }
                      />
                    </button>
                  </div>

                  <div
                    className={`flex items-center text-sm text-gray-500 dark:text-gray-400 ${view === "grid" ? "mb-6" : "mb-0"
                      }`}
                  >
                    <Clock size={16} className="mr-2" />
                    <span className="font-medium">
                      {formatDate(whiteboard.createdAt)}
                    </span>
                  </div>

                  {(view === "grid" || view === "list") &&
                    whiteboard.collaborators &&
                    whiteboard.collaborators.length > 0 && (
                      <div
                        className={`flex items-center ${view === "grid" ? "mt-4" : "ml-4"
                          }`}
                      >
                        <Users
                          size={16}
                          className="mr-2 text-gray-400 dark:text-gray-500"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {whiteboard.collaborators.length}{" "}
                          {t(
                            whiteboard.collaborators.length > 1
                              ? "collaborators"
                              : "collaborator"
                          )}
                        </span>
                      </div>
                    )}
                </div>

                <div
                  className={`${view === "grid"
                    ? "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/90 dark:from-gray-800/90 to-transparent transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    : "flex items-center gap-3 p-4"
                    } flex flex-col sm:flex-row gap-3 sm:gap-2 w-full`}
                >
                  <div className="flex flex-row container mx-auto gap-4 w-full">
                    <button
                      onClick={() => navigateWithLoader(router, `/whiteboard/${whiteboard._id}`)}
                      className="w-full max-w-[50%] sm:w-[50%] sm:max-w-none mx-auto sm:mx-0 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-center bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 text-white rounded-xl font-semibold sm:focus:ring-2 sm:focus:ring-purple-400 sm:hover:from-indigo-700 sm:dark:hover:from-indigo-300 sm:hover:to-purple-700 sm:dark:hover:to-purple-300 transition-all duration-200 sm:hover:scale-105 shadow-lg"
                    >
                      {t("openBoard")}
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteWhiteboard(whiteboard._id);
                      }}
                      className="w-full sm:w-[50%] max-w-[50%] mr-0 sm:max-w-none mx-auto sm:mx-0 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-center bg-gradient-to-r from-red-500 dark:from-red-600 to-pink-500 dark:to-pink-600 text-white rounded-xl font-semibold sm:hover:from-red-600 sm:dark:hover:from-red-500 sm:hover:to-pink-600 sm:dark:hover:to-pink-500 transition-all duration-200 sm:hover:scale-105 shadow-lg"
                    >
                      {view === "grid" ? t("delete") : "🗑️"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {!isLoading && (
          <div className="w-full mt-10 flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:border-purple-300 text-white rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-purple-600">
              Page {page} <span className="text-purple-600 font-bold tracking-wider">of</span> {totalPage}
            </span>
            <button
              onClick={handleNext}
              disabled={page === totalPage}
              className="px-4 py-2 focus:ring-2 hover:bg-purple-700 focus:border-purple-300 bg-purple-600 text-white rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default withAuth(Onboarding);