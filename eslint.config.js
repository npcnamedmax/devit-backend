import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['dist'],
    },
    {
        files: ['**/*.{mjs,js}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': [
                'warn',
                {
                    varsIgnorePattern: '^[A-Z_]',
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                //tsconfigRootDir: new URL(".", import.meta.url).pathname,
            },
        },
    },
    eslintConfigPrettier,
];
