// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/directive-selector": "off",
      "@angular-eslint/component-selector": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@angular-eslint/template/label-has-associated-control": "off",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          "allowExpressions": true
        }
      ],
      "@typescript-eslint/member-ordering": [
        "error",
        {
          "default": ["field", "constructor", "method", "signature"]
        }
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          "accessibility": "explicit",
          "overrides": {
            "accessors": "explicit",
            "constructors": "no-public",
            "methods": "explicit",
            "properties": "explicit",
            "parameterProperties": "explicit"
          }
        }
      ],
      "no-eq-null": 2,
      "no-unused-vars": "off",
      "max-lines": [
        "error",
        {
          "max": 600,
          "skipComments": true,
          "skipBlankLines" : true
        }
      ],
      "max-lines-per-function": [
        "error",
        {
          "max": 75,
          "skipBlankLines": true,
          "skipComments": true
        }
      ],
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);