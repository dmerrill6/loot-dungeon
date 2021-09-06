module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'eslint-plugin-import'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'airbnb/base',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'eslint:recommended',
  ],

  rules: {
    'func-names': 0,
    '@typescript-eslint/no-namespace': 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  settings: {
    indent: ['error', 2],
  },
}
