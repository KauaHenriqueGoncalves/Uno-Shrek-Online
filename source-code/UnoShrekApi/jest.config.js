export default {
  testEnvironment: "node",
  clearMocks: true,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/modules/shared/database/**",
    "!src/modules/shared/exceptions/**",
    "!src/modules/shared/logger/**",
    "!src/modules/**/response/**",
    "!src/modules/schema/**",
    "!src/*.js",
  ],
};
