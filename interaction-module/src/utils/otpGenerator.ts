import otpGenerator from "otp-generator";
import brcypt from "bcrypt";

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
