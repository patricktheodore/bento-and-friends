module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    // Relaxed rules for better developer experience
    "quotes": ["warn", "double"], // Changed to warning instead of error
    "import/no-unresolved": 0,
    "indent": ["warn", 2, { "SwitchCase": 1 }], // Allow some flexibility

    // Disable overly strict rules
    "require-jsdoc": "off", // No mandatory JSDoc comments
    "max-len": ["warn", { "code": 120 }], // Increased line length limit
    "object-curly-spacing": "off", // Allow spaces in object braces
    "comma-dangle": "off", // Don't enforce trailing commas
    "no-trailing-spaces": "warn", // Warning instead of error

    // TypeScript specific relaxations
    "@typescript-eslint/no-explicit-any": "warn", // Allow 'any' with warning
    "@typescript-eslint/no-unused-vars": "warn", // Warning instead of error

    // Allow tabs or spaces (removes no-tabs restriction)
    "no-tabs": "off",

    // Less strict about spacing
    "space-before-function-paren": "off",
    "keyword-spacing": "warn",
    "space-infix-ops": "warn",
  },
};