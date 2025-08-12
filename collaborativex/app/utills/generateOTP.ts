import crypto from 'crypto';

export const generateOTP = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

