import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/uploads/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // T6.1: static widgets served as-is (plain browser scripts, not modules).
    files: ['apps/web/public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { document: 'readonly' } },
  },
  {
    // T3.6: every interactive element in the web app needs a stable locator.
    files: ['apps/web/src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXOpeningElement[name.name=/^(button|input|select|textarea|form|Link|NavLink)$/]:not(:has(JSXAttribute[name.name="data-testid"]))',
          message: 'Interactive elements need a data-testid (see README: Test locators).',
        },
      ],
    },
  },
);
