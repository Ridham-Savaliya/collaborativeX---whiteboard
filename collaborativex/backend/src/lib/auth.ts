import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!;

export const verifyToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email?: string, userId?: string };
        return { email: decoded.email, userId: decoded.userId }
    } catch (error) {
        throw new Error('Invalid or expired Token!')
    }
}   
