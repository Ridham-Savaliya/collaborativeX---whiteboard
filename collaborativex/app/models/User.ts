import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
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
    password: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    profilePicture: { type: String },
    bio: { type: String },
    location: { type: String },
    website: { type: String },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notifications: { type: Boolean, default: true },
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
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        icon: { type: String, required: true },
        unlocked: { type: Boolean, default: false },
        date: { type: Date },
      },
    ],
    recentActivity: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ['created', 'edited', 'shared', 'collaborated'],
          required: true,
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
    whiteboards: [{ type: Schema.Types.ObjectId, ref: 'Whiteboard' }],
    isOnboarded: { type: Boolean, default: false },
    invitees: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
