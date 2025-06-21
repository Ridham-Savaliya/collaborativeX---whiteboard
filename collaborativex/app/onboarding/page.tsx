// ```tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import withAuth from "../api/_lib/withAuth";
import { useGlobalLoader } from "../hooks/useGlobalLoader";

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
  isOnboarded: boolean;
}

const Onboarding = () => {
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

  // Initialize token and fetch user data
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded: any = jwtDecode(storedToken);
        const userId = decoded.userId;
        fetchUserData(userId, storedToken);
      } catch (e) {
        console.error("Failed to decode token:", e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

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
        setUser({ userId, isOnboarded: userData.isOnboarded });
        setIsOnboarding(!userData.isOnboarded);
      } else {
        console.error("Failed to fetch user data");
        router.push("/login");
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
      router.push("/login");
    }
  };

  // Fetch whiteboards
  useEffect(() => {
    if (token) {
      fetchWhiteboards();
    }
  }, [token]);

  const fetchWhiteboards = async () => {
    try {
      const response = await fetch("/api/whiteboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWhiteboards(Array.isArray(data.whiteboards) ? data.whiteboards : []);
      } else {
        console.error("Failed to fetch whiteboards");
        setWhiteboards([]);
      }
    } catch (e) {
      console.error("Error fetching whiteboards:", e);
      setWhiteboards([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
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
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  const deleteWhiteboard = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this whiteboard?")) {
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
        }
      } catch (e) {
        console.error("Error deleting whiteboard:", e);
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
          const newWhiteboard = data.whiteboard || data; // Handle nested or flat response
          if (newWhiteboard._id) {
            setWhiteboards([newWhiteboard, ...whiteboards]);
            setOnboardingStep(1);
            setOnboardingData({ name: "", purpose: "", collaborators: "" });
            await router.push(`/whiteboard/${newWhiteboard._id}`); // Wait for redirect
          } else {
            console.error("Whiteboard ID not found in response:", data);
            alert(
              "Failed to redirect to whiteboard. Please select it from the list."
            );
          }
        } else {
          console.error("Failed to create whiteboard:", response.statusText);
          alert("Failed to create whiteboard. Please try again.");
        }
      } catch (e) {
        console.error("Error creating whiteboard:", e);
        alert("An error occurred. Please try again.");
      }
    }
  };

  const filteredWhiteboards = Array.isArray(whiteboards)
    ? whiteboards
        .filter((board) =>
          board.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((board) => !showFavoritesOnly || board.isFavorite)
    : [];

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                if (onboardingStep > 1) {
                  setOnboardingStep(onboardingStep - 1);
                } else {
                  setIsOnboarding(false);
                }
              }}
              className="p-3 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Whiteboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Step {onboardingStep} of 3
              </p>
            </div>
            <button
              onClick={() => setIsOnboarding(false)}
              className="p-3 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="flex justify-center mb-10">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      step === onboardingStep
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110"
                        : step < onboardingStep
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step < onboardingStep ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                        step < onboardingStep
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gray-200"
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
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target size={28} className="text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    Name your whiteboard
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Give your whiteboard a descriptive name that inspires
                    creativity
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
                    placeholder="e.g., Product Strategy 2025"
                    className="w-full px-6 py-4 rounded-2xl text-[#8028f9] border-2 border-gray-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-lg placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass size={28} className="text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    Choose your purpose
                  </h2>
                  <p className="text-gray-600 text-lg">
                    What will you use this whiteboard for?
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      value: "Team Brainstorm",
                      label: "Team Brainstorm",
                      desc: "Generate and organize ideas",
                      icon: "💡",
                    },
                    {
                      value: "Project Planning",
                      label: "Project Planning",
                      desc: "Plan and track project progress",
                      icon: "📋",
                    },
                    {
                      value: "Design Sprint",
                      label: "Design & Wireframing",
                      desc: "Create mockups and prototypes",
                      icon: "🎨",
                    },
                    {
                      value: "Strategy Session",
                      label: "Strategy Session",
                      desc: "Plan strategic initiatives",
                      icon: "📚",
                    },
                    {
                      value: "Other",
                      label: "Other",
                      desc: "Custom use case",
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
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                        onboardingData.purpose === option.value
                          ? "border-indigo-500 bg-indigo-50 shadow-lg"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    Invite collaborators
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Add team members to collaborate (optional)
                  </p>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={onboardingData.collaborators}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        collaborators: e.target.value,
                      })
                    }
                    placeholder="colleague@company.com, designer@company.com"
                    className="w-full px-6 py-4 rounded-2xl text-[#8028f9] border-2 border-gray-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-lg placeholder-gray-400"
                  />
                  <p className="text-sm text-gray-500 flex items-center">
                    <span className="mr-2">💡</span>
                    Separate multiple emails with commas "<b>,</b>" you can
                    always add more later
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {onboardingStep === 3
                ? "Ready to create!"
                : `${3 - onboardingStep} steps remaining`}
            </div>
            <button
              onClick={handleOnboardingNext}
              disabled={onboardingStep === 1 && !onboardingData.name.trim()}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-200 ${
                onboardingStep === 1 && !onboardingData.name.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              <span className="text-lg">
                {onboardingStep === 3 ? "🚀 Create Whiteboard" : "Continue"}
              </span>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  CollaborativeX
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Creative Workspace Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    showFavoritesOnly
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                      : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
                  }`}
                  aria-label="Show favorites only"
                >
                  <Star
                    size={20}
                    className={showFavoritesOnly ? "fill-white" : ""}
                  />
                </button>

                <button
                  onClick={() => setView(view === "grid" ? "list" : "grid")}
                  className="p-3 rounded-xl bg-gray-100/80 text-gray-500 hover:bg-gray-200/80 transition-all duration-200 hover:scale-105"
                  aria-label="Toggle view"
                >
                  <LayoutGrid size={20} />
                </button>
              </div>

              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search whiteboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white/80 w-full lg:w-80 transition-all duration-200 placeholder-gray-400"
                />
              </div>

              <button
                onClick={() => setIsOnboarding(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-semibold"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">New Whiteboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10">
        {filteredWhiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-2xl">
                <Compass size={56} className="text-indigo-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full animate-pulse delay-500"></div>
            </div>
            {searchTerm ? (
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  No matches found
                </h2>
                <p className="text-gray-600 text-lg">
                  Try adjusting your search terms or clear filters to see all
                  whiteboards
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all duration-200 font-medium"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="text-center max-w-2xl">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Start Your Creative Journey
                </h2>
                <p className="text-gray-600 text-xl mb-8 leading-relaxed">
                  Create your first whiteboard and bring your ideas to life with
                  our premium collaborative workspace designed for modern teams.
                </p>
                <button
                  onClick={() => setIsOnboarding(true)}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 text-lg font-semibold"
                >
                  <Plus size={24} />
                  <span>Create Your First Whiteboard</span>
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
                className={`group relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/30 transition-all duration-300 hover:scale-105 hover:bg-white/90 hover:shadow-2xl overflow-hidden animate-fade-in ${
                  view === "grid"
                    ? "shadow-lg hover:shadow-2xl"
                    : "shadow-md hover:shadow-xl flex items-center"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {view === "grid" && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}

                <div className={`${view === "grid" ? "p-8" : "p-6 flex-grow"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow">
                      <h2
                        className={`font-bold text-gray-800 group-hover:text-indigo-700 transition-colors duration-200 ${
                          view === "grid" ? "text-xl mb-3" : "text-lg mb-2"
                        }`}
                      >
                        {whiteboard.name}
                      </h2>
                      {whiteboard.purpose && (
                        <span className="inline-block text-sm text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full border border-gray-200/50">
                          {whiteboard.purpose}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(whiteboard._id);
                      }}
                      className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 ${
                        whiteboard.isFavorite
                          ? "text-amber-500 bg-amber-50"
                          : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      aria-label={
                        whiteboard.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Star
                        size={18}
                        className={
                          whiteboard.isFavorite ? "fill-amber-500" : ""
                        }
                      />
                    </button>
                  </div>

                  <div
                    className={`flex items-center text-sm text-gray-500 ${
                      view === "grid" ? "mb-6" : "mb-0"
                    }`}
                  >
                    <Clock size={16} className="mr-2" />
                    <span className="font-medium">
                      {formatDate(whiteboard.createdAt)}
                    </span>
                  </div>

                  {view === "grid" &&
                    whiteboard.collaborators &&
                    whiteboard.collaborators.length > 0 && (
                      <div className="flex items-center mt-4">
                        <Users size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {whiteboard.collaborators.length} collaborator
                          {whiteboard.collaborators.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                </div>

                <div
                  className={`${
                    view === "grid"
                      ? "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"
                      : "flex items-center gap-3 p-4"
                  }`}
                >
                  <button
                    onClick={() => navigateWithLoader(router,`whiteboard/${whiteboard._id}`)}
                    className="flex-1 text-center px-4 py-3 mr-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
                    aria-label={`Open whiteboard ${whiteboard.name}`}
                  >
                    Open Board
                  </button>
                  <button
                    className="px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteWhiteboard(whiteboard._id);
                    }}
                  >
                    {view === "grid" ? "Delete" : "🗑️"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default withAuth(Onboarding);
