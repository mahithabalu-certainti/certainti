import otpGenerator from "otp-generator";
import brcypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { getSecret } from "./azureSecrets";

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

export async function generateCustomJwtToken(
  payload: object,
  expiresIn = process.env.JWT_EXPIRY || "1h"
) {
  const { CUSTOM_PVT_KEY, CUSTOM_JWT_AUDIENCE, CUSTOM_JWT_ISSUER } =
    await getAzureCustomJwtSecrets();

  if (!CUSTOM_PVT_KEY || !CUSTOM_JWT_AUDIENCE || !CUSTOM_JWT_ISSUER) {
    throw new Error("One or more required jwt secrets are missing.");
  }

  const privateKey = formatPrivateKey(CUSTOM_PVT_KEY);

  const tokenPayload = {
    sub: "user123",
    appid: CUSTOM_JWT_AUDIENCE,
    iss: CUSTOM_JWT_ISSUER,
    aud: CUSTOM_JWT_AUDIENCE,
    ...payload,
  };

  const signOptions: SignOptions = {
    expiresIn: "1h",
    algorithm: "RS256",
  };

  const token = jwt.sign(tokenPayload, privateKey, signOptions);
  await validateToken(token);

  return token;
}

export async function generateNewCustomJwtKey(oldToken: string) {
  let oldPayload: any = {};
  const { CUSTOM_PUB_KEY, CUSTOM_PVT_KEY, CUSTOM_JWT_AUDIENCE } =
    await getAzureCustomJwtSecrets();

  if (!CUSTOM_PVT_KEY || !CUSTOM_PUB_KEY || !CUSTOM_JWT_AUDIENCE) {
    throw new Error("One or more required jwt secrets are missing.");
  }

  try {
    const pubKey = formatPublicKey(CUSTOM_PUB_KEY);
    
    oldPayload = jwt.verify(oldToken, pubKey, {
      algorithms: ["RS256"],
      audience: CUSTOM_JWT_AUDIENCE,
      ignoreExpiration: true,
    });
  } catch (err) {
    console.error("Token verification failed:", err);
    return;
  }

  const newPayload = { ...oldPayload };
  newPayload.sub = "new-user-456";

  const privateKey = formatPrivateKey(CUSTOM_PVT_KEY);

  // Encode new token
  const newToken = jwt.sign(newPayload, privateKey, {
    algorithm: "RS256",
  });

  return newToken;
}

async function validateToken(token: string) {
  const { CUSTOM_PUB_KEY, CUSTOM_JWT_AUDIENCE } =
    await getAzureCustomJwtSecrets();

  if (!CUSTOM_PUB_KEY || !CUSTOM_JWT_AUDIENCE) {
    throw new Error("One or more required jwt secrets are missing.");
  }

  try {
    const decoded = jwt.verify(token, CUSTOM_PUB_KEY, {
      algorithms: ["RS256"],
      audience: CUSTOM_JWT_AUDIENCE,
    });
    console.log("Valid token. Claims:");
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      console.log("Token expired. Generate a new one.");
    } else {
      console.log("Invalid token:", err.message);
    }
  }
}

async function getAzureCustomJwtSecrets() {
  try {
    const secrets = await Promise.all([
      getSecret(process.env.CUSTOM_PVT_KEY as string),
      getSecret(process.env.CUSTOM_PUB_KEY as string),
      getSecret(process.env.CUSTOM_JWT_AUDIENCE as string),
      getSecret(process.env.CUSTOM_JWT_ISSUER as string),
    ]);

    return {
      CUSTOM_PVT_KEY: secrets[0],
      CUSTOM_PUB_KEY: secrets[1],
      CUSTOM_JWT_AUDIENCE: secrets[2],
      CUSTOM_JWT_ISSUER: secrets[3],
    };
  } catch (error) {
    throw new Error(
      `Error fetching Azure secrets: ${(error as Error).message}`
    );
  }
}

function formatPrivateKey(rawKey: string): string {
  return rawKey
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----\s*/, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/\s*-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----")
    .trim();
}

function formatPublicKey(rawKey: string): string {
  return rawKey
    .replace(/\\n/g, "\n")
    .replace(
      /-----BEGIN (CERTIFICATE|PUBLIC KEY)-----\s*/,
      "-----BEGIN $1-----\n"
    )
    .replace(/\s*-----END (CERTIFICATE|PUBLIC KEY)-----/, "\n-----END $1-----")
    .trim();
}
