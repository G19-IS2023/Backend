module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
      testMatch: [ "/__tests__//*.[jt]s?(x)", "**/?(*.)+(spec|test).js?(x)" ],
      testTimeout: 20000,
};
  