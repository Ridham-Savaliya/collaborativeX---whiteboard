import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config()
const connectDB = async () => {
  try {
    console.log("MONGODB_URI from env:", process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI! as string);
    console.log(`MongoDB Connected in frontend: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
