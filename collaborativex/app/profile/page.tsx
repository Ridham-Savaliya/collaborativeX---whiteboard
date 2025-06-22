"use client";
import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiSettings,
  FiCalendar,
  FiAward,
  FiActivity,
  FiEdit3,
  FiSave,
  FiX,
  FiCamera,
  FiUpload,
  FiGrid,
  FiClock,
  FiHome,
  FiArrowLeft,
} from "react-icons/fi";
import withAuth from "../api/_lib/withAuth";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next"; // Import useTranslation

interface UserProfile {
  name?: string;
  email: string;
  username?: string;
  profilePicture?: string;
  createdAt: string;
  bio?: string;
  location?: string;
  website?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    privacy: boolean;
    language: string;
  };
}

interface UserStats {
  whiteboards: number;
  collaborations: number;
  timeSpent: string;
  achievements: number;
}

interface Achievement {
  id: string;
  title: string;
  description?: string;
  icon: string;
  unlocked: boolean;
  date?: number;
  _id: string;
}

interface Activity {
  id: string;
  type: "created" | "edited" | "shared" | "collaborated";
  title: string;
  description: string;
  timestamp: number;
  _id: string;
}

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize translation hook
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("activityTab");

  const defaultUser: UserProfile = {
    name: "",
    email: "",
    username: "",
    profilePicture: "",
    createdAt: new Date().toISOString(),
    bio: "",
    location: "",
    website: "",
    preferences: {
      theme: "system",
      notifications: true,
      privacy: false,
      language: i18n.language || "en", // Initialize with current language
    },
  };

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [stats, setStats] = useState<UserStats>({
    whiteboards: 0,
    collaborations: 0,
    timeSpent: "0h",
    achievements: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: defaultUser.name,
    bio: defaultUser.bio,
    location: defaultUser.location,
    website: defaultUser.website,
    profilePicture: defaultUser.profilePicture,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [AllAchievements, setAllAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (currentTab) setActiveTab(currentTab);
  }, [currentTab]);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      if (!token) return;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const [profileRes, achievementsRes, activitiesRes] = await Promise.all([
          fetch("/api/user/profile", { method: "GET", headers }),
          fetch("/api/user/achievements", {
            method: "POST",
            headers,
            body: JSON.stringify({}),
          }),
          fetch("/api/user/activity", {
            method: "POST",
            headers,
            body: JSON.stringify({}),
          }),
        ]);

        if (profileRes.ok) {
          const userData = await profileRes.json();
          const safeUserData: UserProfile = {
            ...defaultUser,
            ...userData,
            preferences: {
              ...defaultUser.preferences,
              ...userData.preferences,
              theme: userData.preferences?.theme || "system",
              language: userData.preferences?.language || "en",
            },
          };
          setUser(safeUserData);
          setFormData({
            name: safeUserData.name || "",
            bio: safeUserData.bio || "",
            location: safeUserData.location || "",
            website: safeUserData.website || "",
            profilePicture: safeUserData.profilePicture || "",
          });
          setStats(
            userData.stats || {
              whiteboards: 0,
              collaborations: 0,
              timeSpent: "0h",
              achievements: 0,
            }
          );
          setTheme(safeUserData.preferences.theme);
          // Sync i18next language with user preference
          if (safeUserData.preferences.language) {
            i18n.changeLanguage(safeUserData.preferences.language);
          }
        } else {
          throw new Error(t("errors.fetchProfile"));
        }

        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievements(data.achievements || []);
        } else {
          throw new Error(t("errors.fetchAchievements"));
        }

        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data.history || []);
        } else {
          throw new Error(t("errors.fetchActivities"));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setUser(defaultUser);
        setStats({
          whiteboards: 0,
          collaborations: 0,
          timeSpent: "0h",
          achievements: 0,
        });
        setAchievements([]);
        setActivities([]);
        setError(t("errors.loadProfile"));
        toast.error(t("errors.loadProfile"));
      }
    };

    fetchData();
  }, [token, setTheme, i18n, t]);

  const handleUpdateProfilePicture = async () => {
    if (!selectedFile || !token) return;
    try {
      const imageData = new FormData();
      imageData.append("file", selectedFile);
      imageData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "colloborativex"
      );

      const uploadRes = await fetch(
        "https://api.cloudinary.com/v1_1/dsqpc6sp6/image/upload",
        { method: "POST", body: imageData }
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(t("errors.imageUpload"));

      const profilePictureUrl = uploadData.secure_url;
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          profilePicture: profilePictureUrl,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setFormData((prev) => ({ ...prev, profilePicture: profilePictureUrl }));
        setError(null);
        toast.success(t("success.profilePicture"));
      } else {
        throw new Error(t("errors.updateProfilePicture"));
      }
    } catch (err) {
      console.error("Error updating profile picture:", err);
      setError(t("errors.updateProfilePicture"));
      toast.error(t("errors.updateProfilePicture"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePreferenceChange = async (
    key: keyof UserProfile["preferences"],
    value: any
  ) => {
    if (!token) {
      setError(t("errors.noToken"));
      toast.error(t("errors.loginRequired"));
      return;
    }
    const previousTheme = user.preferences.theme;
    try {
      if (key === "theme") {
        setTheme(value);
        setUser((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, theme: value },
        }));
      } else if (key === "language") {
        await i18n.changeLanguage(value); // Update i18next language
      }
      const payload = { ...user.preferences, [key]: value };
      const response = await fetch("/api/user/profile/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedPreferences = {
          ...user.preferences,
          ...data.preferences,
          theme: data.preferences?.theme || value,
        };
        setUser((prev) => ({
          ...prev,
          preferences: updatedPreferences,
        }));
        setTheme(updatedPreferences.theme);
        toast.success(data?.message || t("success.preferencesUpdated"));
        setError(null);
      } else {
        throw new Error(t("errors.updatePreferences"));
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
      const errorMessage =
        err instanceof Error ? err.message : t("errors.updatePreferences");
      setError(errorMessage);
      if (key === "theme") {
        setTheme(previousTheme);
        setUser((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, theme: previousTheme },
        }));
      }
      toast.error(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!token) {
      setError(t("errors.noToken"));
      toast.error(t("errors.loginRequired"));
      return;
    }
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        setError(null);
        toast.success(t("success.profileUpdated"));
      } else {
        throw new Error(t("errors.updateProfile"));
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(t("errors.updateProfile"));
      toast.error(t("errors.updateProfile"));
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchAchievements = async () => {
      try {
        const { data } = await axios.get("/api/user/achievements", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (data) {
          setAllAchievements(data?.ACHIEVEMENT_PRESETS || []);
        } else {
          toast.error(t("errors.fetchAchievements"));
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
        toast.error(t("errors.loadAchievements"));
      }
    };

    fetchAchievements();
  }, [token, t]);

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      profilePicture: user.profilePicture || "",
    });
    setEditing(false);
    setError(null);
  };

  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <FiGrid className="w-4 h-4" />;
      case "edited":
        return <FiEdit3 className="w-4 h-4" />;
      case "shared":
        return <FiUpload className="w-4 h-4" />;
      case "collaborated":
        return <FiUser className="w-4 h-4" />;
      default:
        return <FiActivity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "created":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200";
      case "edited":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200";
      case "shared":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200";
      case "collaborated":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const mergedAchievements = AllAchievements.map((preset) => {
    const userAchievement = achievements.find((ach) => ach.id === preset.id);
    return userAchievement || { ...preset, unlocked: false, _id: preset.id };
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden sticky top-8">
              <div className="text-center p-8 bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500">
                <div className="relative inline-block">
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => router.back()}
                      className="flex items-center gap-2 dark:text-white hover:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                      <span className="font-medium">{t("goBack")}</span>
                    </button>
                  </div>
                  <img
                    src={user.profilePicture || "https://via.placeholder.com/150"}
                    alt={t("profilePictureAlt")}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                  <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <FiCamera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <button
                  onClick={handleUpdateProfilePicture}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t("uploadProfilePicture")}
                </button>
                <h2 className="text-xl font-bold text-white mt-4">
                  {user.name || t("defaultUserName")}
                </h2>
                <p className="text-purple-100 dark:text-purple-200">
                  @{user.username || t("defaultUsername")}
                </p>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  {[
                    { id: "overview", label: t("overview"), icon: FiHome },
                    { id: "activity", label: t("activity"), icon: FiActivity },
                    { id: "achievements", label: t("achievements"), icon: FiAward },
                    { id: "settings", label: t("settings"), icon: FiSettings },
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all ${
                          activeTab === item.id
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 shadow-md"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400"
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: t("whiteboards"),
                      value: stats.whiteboards,
                      icon: FiGrid,
                      color: "purple",
                    },
                    {
                      label: t("collaborations"),
                      value: stats.collaborations,
                      icon: FiUser,
                      color: "blue",
                    },
                    {
                      label: t("timeSpent"),
                      value: stats.timeSpent,
                      icon: FiClock,
                      color: "green",
                    },
                    {
                      label: t("achievements"),
                      value: stats.achievements,
                      icon: FiAward,
                      color: "orange",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900`}
                        >
                          <stat.icon
                            className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-200`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t("profileInformation")}
                    </h3>
                    <button
                      onClick={() => setEditing(!isEditing)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FiEdit3 className="w-4 h-4 mr-2" />
                      {isEditing ? t("cancel") : t("edit")}
                    </button>
                  </div>
                  <div className="p-8">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("name")}
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("bio")}
                          </label>
                          <input
                            type="text"
                            name="bio"
                            value={formData.bio || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("location")}
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("website")}
                          </label>
                          <input
                            type="text"
                            name="website"
                            value={formData.website || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={handleSave}
                            className="flex items-center px-6 py-3 bg-purple-600 text-white dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <FiSave className="w-4 h-4 mr-2" />
                            {t("saveChanges")}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <FiX className="w-4 h-4 mr-2" />
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t("contact")}
                          </h4>
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t("email")}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {user.email || t("notProvided")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t("location")}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {user.location || t("notProvided")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t("website")}
                              </p>
                              <p className="text-lg font-medium text-purple-600 dark:text-purple-400">
                                {user.website || t("notProvided")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t("about")}
                          </h4>
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t("bio")}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {user.bio || t("notProvided")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t("memberSince")}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("recentActivity")}
                  </h3>
                </div>
                <div className="p-8">
                  <div className="space-y-6">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <div
                          key={activity._id}
                          className="flex items-start space-x-4"
                        >
                          <div
                            className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(
                              activity.type
                            )}`}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {activity.title}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              {activity.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">
                        {t("noActivities")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("achievements")}
                  </h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mergedAchievements.length > 0 ? (
                      mergedAchievements.map((achievement) => (
                        <div
                          key={achievement._id}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            achievement.unlocked
                              ? "border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900"
                              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-50"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {achievement.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300">
                                {achievement.description || t("noDescription")}
                              </p>
                              {achievement.unlocked && achievement.date && (
                                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                                  {t("unlockedOn")} {formatDate(achievement.date)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">
                        {t("noAchievements")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("settings")}
                  </h3>
                </div>
                <div className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t("preferences")}
                      </h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {t("theme")}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {t("chooseTheme")}
                            </p>
                          </div>
                          <select
                            value={user.preferences.theme}
                            onChange={(e) =>
                              handlePreferenceChange("theme", e.target.value)
                            }
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="light">{t("light")}</option>
                            <option value="dark">{t("dark")}</option>
                            <option value="system">{t("system")}</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {t("emailNotifications")}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {t("emailNotificationsDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.preferences.notifications}
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "notifications",
                                  e.target.checked
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {t("dataSharing")}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {t("dataSharingDesc")}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.preferences.privacy}
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "privacy",
                                  e.target.checked
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {t("language")}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {t("selectLanguage")}
                            </p>
                          </div>
                          <select
                            value={user.preferences.language}
                            onChange={(e) =>
                              handlePreferenceChange("language", e.target.value)
                            }
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="en">{t("english")}</option>
                            <option value="hi">{t("hindi")}</option>
                            <option value="gu">{t("gujarati")}</option>
                            <option value="de">{t("spanish")}</option>
                            <option value="es">{t("germen")}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(Profile);
