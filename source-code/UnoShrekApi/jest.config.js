export default {
  testEnvironment: "node",
  clearMocks: true,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/config/database/**",
    "!src/config/exceptions/**",
    "!src/config/logger/**",
    "!src/dtos/response/**",
    "!src/schema/**",
    "!src/*.js"
  ]
};