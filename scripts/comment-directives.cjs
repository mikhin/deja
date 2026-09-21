const DIRECTIVE_PATTERNS = [
  /^eslint-(disable|enable)/,
  /^oxlint-(disable|enable)/,
  /^@ts-(expect-error|ignore|nocheck|check)/,
  /^biome-ignore/,
  /^prettier-ignore/,
  /^oxfmt-ignore/,
  /^(istanbul|c8|v8|node:coverage)\b/,
  /^[Ss]tryker/,
  /^@vitest-/,
  /^@vite-ignore/,
  /^webpack[A-Z]/,
  /^<reference\b/,
  /^@(license|preserve|jsx|jsxImportSource|jsxRuntime)/,
  /^@knip|^knip-/,
  /^ponytail:/,
];

const isDirective = (comment) => {
  const body = comment
    .replace(/^\/\/\/?/, "")
    .replace(/^\/\*/, "")
    .replace(/\*\/$/, "")
    .replace(/^\*+/, "")
    .trim();

  return DIRECTIVE_PATTERNS.some((pattern) => pattern.test(body));
};

module.exports = { isDirective };
