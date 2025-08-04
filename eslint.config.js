import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['node_modules', 'dist']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    plugins: { js },
    extends: ['js/recommended', tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        definePage: 'readonly'
      }
    },
    rules: {
      // typescrippt rules
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-empty-object-type': ['off'],
      '@typescript-eslint/no-unused-expressions': ['off'],
      '@typescript-eslint/no-explicit-any': ['off']
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    extends: [pluginVue.configs['flat/essential']],
    rules: {
      'vue/multi-word-component-names': ['off']
    }
  }
]);
