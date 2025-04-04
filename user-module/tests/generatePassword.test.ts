import { generateSecurePassword } from "../src/utils/generatePassword";

describe("generateSecurePassword", () => {
  it("should generate a password of default length 12", async () => {
    const password = await generateSecurePassword();
    expect(password.length).toBe(12);
  });

  it("should generate a password of specified length", async () => {
    const length = 16;
    const password = await generateSecurePassword(length);
    expect(password.length).toBe(length);
  });

  it("should contain at least one uppercase letter", async () => {
    const password = await generateSecurePassword();
    const hasUppercase = /[A-Z]/.test(password);
    expect(hasUppercase).toBe(true);
  });

  it("should contain at least one lowercase letter", async () => {
    const password = await generateSecurePassword();
    const hasLowercase = /[a-z]/.test(password);
    expect(hasLowercase).toBe(true);
  });

  it("should contain at least one number", async () => {
    const password = await generateSecurePassword();
    const hasNumber = /\d/.test(password);
    expect(hasNumber).toBe(true);
  });

  it("should contain at least one special character", async () => {
    const password = await generateSecurePassword();
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    expect(hasSpecialChar).toBe(true);
  });

  it("should generate a different password each time", async () => {
    const password1 = await generateSecurePassword();
    const password2 = await generateSecurePassword();
    expect(password1).not.toBe(password2);
  });

  it("should handle password generation for short lengths", async () => {
    const password = await generateSecurePassword(4);
    expect(password.length).toBe(4);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/\d/.test(password)).toBe(true);
    expect(/[!@#$%^&*]/.test(password)).toBe(true);
  });

  it("should handle very large password length", async () => {
    const length = 1000;
    const password = await generateSecurePassword(length);
    expect(password.length).toBe(length);
  });
});
