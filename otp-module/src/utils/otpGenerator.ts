import otpGenerator from "otp-generator";
import brcypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

export const generateRandomOtpDigit = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
};

export const hashOtp = async (otp: string): Promise<string> => {
  const otpHash = await brcypt.hash(otp, 10);
  return otpHash;
};

export async function compareOtp(
  plainOtp: string,
  hashedOtp: string
): Promise<boolean> {
  return await brcypt.compare(plainOtp, hashedOtp);
}

export function generateJwtToken(
  payload: object,
  expiresIn = process.env.JWT_EXPIRY || '1h'
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured");
  }

  const signOptions: SignOptions = {
    expiresIn: '1h'
  };

  return jwt.sign(payload, secret, signOptions);
}
