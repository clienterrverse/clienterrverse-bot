import { ESLint } from 'eslint';
import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';

const eslint = new ESLint({
  overrideConfig: {
    env: {
      node: true, // Specify that the environment is Node.js
      es2021: true, // Use ES2021 features
    },

    parserOptions: {
      ecmaVersion: 2021, // Use modern ECMAScript features
      sourceType: 'module', // Allow using imports
    },
    rules: {
      'no-unused-vars': 'warn',
      'import/no-unresolved': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'as-needed'],
      'consistent-return': 'error',
      indent: ['error', 2], // Enforce consistent indentation (2 spaces)
      'linebreak-style': ['error', 'unix'], // Enforce consistent linebreak style
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn and console.error
      quotes: ['error', 'single'], // Enforce the use of single quotes
      'object-curly-spacing': ['error', 'always'], // Enforce consistent spacing inside braces
      semi: ['error', 'always'], // Enforce semi-colons
      'comma-dangle': ['error', 'es5'], // Enforce trailing commas where valid in ES5
      'space-before-function-paren': ['error', 'always'], // Enforce consistent spacing before function parentheses
      'keyword-spacing': ['error', { before: true, after: true }], // Enforce consistent spacing around keywords
      'no-shadow': 'error', // Disallow variable declarations from shadowing outer scope declarations
      'prefer-template': 'error', // Prefer template literals over string concatenation
      'array-callback-return': 'error', // Ensure return statements in callbacks of array methods
      'callback-return': ['error', ['callback', 'cb']], // Require return statements after callbacks
      'consistent-this': ['error', 'self'], // Enforce a consistent naming for `this`
      'handle-callback-err': 'error', // Require error handling in callbacks
    },
  },
});

export default eslint;
