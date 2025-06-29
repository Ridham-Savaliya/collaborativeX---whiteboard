import jwt from 'jsonwebtoken';
import dotenv, { config } from "dotenv"

import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
}

interface DecodedToken {
    email?: string;
    userId?: string;
    name?: string;
    iat?: number;   // issued at
    exp?: number;   // expiry time
}

export const verifyToken = (token: string) => {
    try {
        // const token = socket.handshake.auth.token;
        // console.log("Received token:", token, typeof token);
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        if (!decoded.email || !decoded.userId || !decoded.name) {
            throw new Error("Token missing required fields");
        }

        return {
            email: decoded.email,
            userId: decoded.userId,
            name: decoded.name,
        };
    } catch (error: any) {
        console.error("JWT verification failed:", error.message);
        throw new Error("Invalid or expired token!");
    }
};
