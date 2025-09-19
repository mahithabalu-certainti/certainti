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
