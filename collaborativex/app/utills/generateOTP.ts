import crypto from 'crypto'

export const generateOTP = () => {
    return crypto.randomInt(1000000,9000000).toString();
}
