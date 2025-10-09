/* eslint-env node */
module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script', // CommonJS
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
      },
    },
    rules: {},
  },
]
