/**
 * Generates a secure random password with a specified length.
 * 
 * The password will contain at least one uppercase letter, one lowercase letter,
 * one number, and one special character. The rest of the password will be filled with 
 * random characters chosen from a pool of uppercase, lowercase, numeric, and special characters.
 * The final password is shuffled to ensure randomness in the arrangement of characters.
 * 
 * @param {number} [length=12] - The desired length of the generated password. Defaults to 12 if not provided.
 * 
 * @returns {Promise<string>} - A promise that resolves with the generated password string.
 * 
 * @example
 * // Generates a secure password with default length (12 characters)
 * const password = await generateSecurePassword();
 * 
 * @example
 * // Generates a secure password with a custom length (16 characters)
 * const password = await generateSecurePassword(16);
 */
const generateSecurePassword = async (length: number = 12): Promise<string> => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < length - 4; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  const shuffledPassword = await new Promise<string>((resolve) => {
    resolve(
      password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("")
    );
  });

  return shuffledPassword;
};

export { generateSecurePassword };
