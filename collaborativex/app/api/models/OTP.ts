import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document {
    otp:String;
    userId:String;
    createdAt:Date;
}

const OTPSchema: Schema = new Schema({
    otp: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    createdAt:{
        expiresIn:300,
        type:Date,
        default:Date.now
    }
})

export default mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema)
