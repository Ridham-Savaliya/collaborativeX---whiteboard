import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  RideOffered: boolean;
  website?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    privacy: boolean;
    language: string;
  };
  stats: {
    whiteboards: number;
    collaborations: number;
    timeSpent: string;
    achievements: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    date?: Date;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'edited' | 'shared' | 'collaborated';
    title: string;
    description: string;
    timestamp: Date;
  }>;
  whiteboards: Array<mongoose.Types.ObjectId>;
  isOnboarded: boolean;
  invitees?: Array<string>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    name: { type: String, required: true },
    profilePicture: { type: String, default: "upload your profilePicture here!" },
    bio: { type: String, default: "Enter your bio." },

    oauthVerified: { type: Boolean, default: false },
    location: { type: String, default: "Enter your location." },
    website: {
      type: String,
      default: "Enter your site here"
    },
    RideOffered: { type: Boolean, default: false },

    oauthProviders: [{
      provider: {
        type: String,
        enum: ['google', 'microsoft', 'linkedin', 'facebook'],
      },
      providerId: String,
      verifiedAt: {
        type: Date,
        default: Date.now,
      }
    }],
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      notifications: { type: Boolean, default: false },
      privacy: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
    },
    stats: {
      whiteboards: { type: Number, default: 0 },
      collaborations: { type: Number, default: 0 },
      timeSpent: { type: String, default: '0h' },
      achievements: { type: Number, default: 0 },
    },
    achievements: [
      {
        id: { type: String, required: false },
        title: { type: String, required: false },
        description: { type: String, required: false },
        icon: { type: String, required: false },
        unlocked: { type: Boolean, default: false },
        date: { type: Date },
      },
    ],
    recentActivity: [
      {
        id: { type: String, required: false },
        type: {
          type: String,
          enum: ['created', 'edited', 'shared', 'collaborated'],
          required: false,
        },
        title: { type: String, required: false },
        description: { type: String, required: false },
        timestamp: { type: Date, required: false },
      },
    ],
    isEnabledEmails: { type: Boolean, default: true },
    isEnabledPrivacyMode: { type: Boolean, default: false },
    whiteboards: [{ type: Schema.Types.ObjectId, ref: 'Whiteboard' }],
    isOnboarded: { type: Boolean, default: false },
    invitees: [{ type: String, default: [] }],

  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
