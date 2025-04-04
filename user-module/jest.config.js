module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@services/(.*)$": "<rootDir>/src/service/$1",
  },
};
