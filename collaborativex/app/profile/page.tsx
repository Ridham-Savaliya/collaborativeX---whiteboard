'use client'
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
  FiUpload,
  FiCamera,
  FiBell,
  FiShield,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiClock,
  FiHome,
  FiGrid
} from "react-icons/fi";

interface UserProfile {
  name: string;
  email: string;
  username: string;
  profilePicture: string;
  createdAt: string;
  bio: string;
  location: string;
  website: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
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
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

interface Activity {
  id: string;
  type: 'created' | 'edited' | 'shared' | 'collaborated';
  title: string;
  description: string;
  timestamp: string;
}

const Profile: React.FC = () => {
  const defaultUser: UserProfile = {
    name: "Alex Rodriguez",
    email: "alex.rodriguez@example.com",
    username: "alexr_design",
    profilePicture: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=150&h=150&fit=crop&crop=face",
    createdAt: new Date("2024-01-15").toISOString(),
    bio: "Creative designer passionate about visual storytelling and collaborative innovation.",
    location: "San Francisco, CA",
    website: "https://alexrodriguez.design",
    preferences: {
      theme: "system",
      notifications: true,
      privacy: false,
      language: "en"
    }
  };

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [stats] = useState<UserStats>({
    whiteboards: 24,
    collaborations: 156,
    timeSpent: "127h",
    achievements: 8
  });

  const [achievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "First Whiteboard",
      description: "Created your first whiteboard",
      icon: "🎨",
      unlocked: true,
      date: "2024-01-15"
    },
    {
      id: "2",
      title: "Collaborator",
      description: "Invited 10 people to collaborate",
      icon: "🤝",
      unlocked: true,
      date: "2024-02-10"
    },
    {
      id: "3",
      title: "Creative Streak",
      description: "Used the platform for 30 consecutive days",
      icon: "🔥",
      unlocked: true,
      date: "2024-03-01"
    },
    {
      id: "4",
      title: "Master Creator",
      description: "Create 50 whiteboards",
      icon: "👑",
      unlocked: false
    }
  ]);

  const [activities] = useState<Activity[]>([
    {
      id: "1",
      type: "created",
      title: "New Marketing Campaign",
      description: "Created a new whiteboard for Q2 marketing strategy",
      timestamp: "2024-05-26T10:30:00Z"
    },
    {
      id: "2",
      type: "collaborated",
      title: "Design Review Session",
      description: "Collaborated with team on product redesign",
      timestamp: "2024-05-25T14:20:00Z"
    },
    {
      id: "3",
      type: "shared",
      title: "Shared Project Alpha",
      description: "Shared whiteboard with external stakeholders",
      timestamp: "2024-05-24T09:15:00Z"
    },
    {
      id: "4",
      type: "edited",
      title: "Updated Brand Guidelines",
      description: "Made updates to the brand guidelines whiteboard",
      timestamp: "2024-05-23T16:45:00Z"
    }
  ]);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: defaultUser.name,
    bio: defaultUser.bio,
    location: defaultUser.location,
    website: defaultUser.website,
    profilePicture: defaultUser.profilePicture
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        // Ensure parsed user has all required properties
        if (parsedUser && parsedUser.preferences && parsedUser.preferences.theme) {
          setUser(parsedUser);
        } else {
          setUser(defaultUser);
        }
      } catch (e) {
        console.error("Error parsing user profile from localStorage:", e);
        setUser(defaultUser);
      }
    }
    // No need to set defaultUser here since user is initialized with it
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("userProfile", JSON.stringify(user));
      // Apply theme
      const root = document.documentElement;
      if (user.preferences.theme === 'dark') {
        root.classList.add('dark');
      } else if (user.preferences.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  }, [user, mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePreferenceChange = (key: keyof UserProfile['preferences'], value: any) => {
    setUser({
      ...user,
      preferences: { ...user.preferences, [key]: value }
    });
  };

  const handleSave = () => {
    setUser({ ...user, ...formData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      bio: user.bio,
      location: user.location,
      website: user.website,
      profilePicture: user.profilePicture
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <FiGrid className="w-4 h-4" />;
      case 'edited': return <FiEdit3 className="w-4 h-4" />;
      case 'shared': return <FiUpload className="w-4 h-4" />;
      case 'collaborated': return <FiUser className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-purple-100 text-purple-600';
      case 'edited': return 'bg-blue-100 text-blue-600';
      case 'shared': return 'bg-green-100 text-green-600';
      case 'collaborated': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden sticky top-8">
              <div className="text-center p-8 bg-gradient-to-br from-purple-600 to-indigo-600">
                <div className="relative inline-block">
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                    <FiCamera className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-white mt-4">{user.name}</h2>
                <p className="text-purple-100">@{user.username}</p>
              </div>

              <nav className="p-4">
                <ul className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: FiHome },
                    { id: 'activity', label: 'Activity', icon: FiActivity },
                    { id: 'achievements', label: 'Achievements', icon: FiAward },
                    { id: 'settings', label: 'Settings', icon: FiSettings }
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all ${
                          activeTab === item.id
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Whiteboards', value: stats.whiteboards, icon: FiGrid, color: 'purple' },
                    { label: 'Collaborations', value: stats.collaborations, icon: FiUser, color: 'blue' },
                    { label: 'Time Spent', value: stats.timeSpent, icon: FiClock, color: 'green' },
                    { label: 'Achievements', value: stats.achievements, icon: FiAward, color: 'orange' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                          <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Profile Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FiEdit3 className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  <div className="p-8">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                          <input
                            type="text"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                          <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={handleSave}
                            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <FiSave className="w-4 h-4 mr-2" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <FiX className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</h4>
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{user.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Location</p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{user.location}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Website</p>
                              <p className="text-lg font-medium text-purple-600 dark:text-purple-400">{user.website}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">About</h4>
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Bio</p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{user.bio}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Member Since</p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="p-8">
                  <div className="space-y-6">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-gray-600 dark:text-gray-300">{activity.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          achievement.unlocked
                            ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{achievement.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300">{achievement.description}</p>
                            {achievement.unlocked && achievement.date && (
                              <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                                Unlocked on {formatDate(achievement.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h3>
                </div>
                <div className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose your preferred theme</p>
                          </div>
                          <select
                            value={user.preferences.theme}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Receive email updates about your activity</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.preferences.notifications}
                              onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Privacy Mode</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Hide your profile from search results</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.preferences.privacy}
                              onChange={(e) => handlePreferenceChange('privacy', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Language</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Select your preferred language</p>
                          </div>
                          <select
                            value={user.preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
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

export default Profile;
