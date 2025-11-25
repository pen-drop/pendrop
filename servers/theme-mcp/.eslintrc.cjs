module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': ['warn', {
      ignoreRestArgs: true,
    }],
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', 'vitest.config.ts'],
};

