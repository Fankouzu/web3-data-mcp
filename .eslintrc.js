module.exports = {
  env: {
    node:   true,
    es2022: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType:  'module'
  },
  rules: {
    // Enforce consistent semicolon usage
    semi: ['error', 'always'],

    // Allow console.log for debugging in development
    'no-console': 'off',

    // Enforce consistent spacing
    'space-before-function-paren': ['error', {
      anonymous:  'always',
      named:      'never',
      asyncArrow: 'always'
    }],

    // Allow unused parameters with underscore prefix
    'no-unused-vars': 'off',

    // Enforce consistent comma-dangle
    'comma-dangle': ['error', 'never'],

    // Allow multiple spaces for alignment
    'no-multi-spaces': ['error', {
      ignoreEOLComments: true,
      exceptions:        {
        Property:           true,
        VariableDeclarator: true,
        ImportDeclaration:  true
      }
    }],

    // Enforce consistent quotes
    quotes: ['error', 'single', { allowTemplateLiterals: true }],

    // Allow empty catch blocks for optional error handling
    'no-empty': ['error', { allowEmptyCatch: true }],

    // Enforce consistent object property spacing
    'key-spacing': ['error', { align: 'value' }],

    // Allow long lines for URLs and template strings
    'max-len': 'off',

    // Allow lexical declarations in case blocks
    'no-case-declarations': 'off'
  },

  // Override rules for test files
  overrides: [
    {
      files: ['test*.js', 'tests/**/*.js'],
      env:   {
        jest: true,
        node: true
      },
      rules: {
        'no-console':     'off',
        'no-unused-vars': 'off'
      }
    }
  ]
};
