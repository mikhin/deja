const { isDirective } = require("../comment-directives.cjs");

const TEST_FILE = /\.(spec|test)\.[cm]?[jt]sx?$|test-utils\.ts$/;

const isFunction = (node) =>
  node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";

const exportedFunctions = (node) => {
  const decl = node.declaration;

  if (!decl || node.exportKind === "type") return [];

  if (decl.type === "FunctionDeclaration") return [decl.id?.name ?? "anonymous"];

  if (decl.type !== "VariableDeclaration") return [];

  return decl.declarations
    .filter((declarator) => isFunction(declarator.init))
    .map((declarator) => declarator.id?.name ?? "anonymous");
};

const isTestFile = (context) => TEST_FILE.test(context.filename ?? context.getFilename());

const noComments = {
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type === "Shebang") continue;

          const text = comment.type === "Line" ? `//${comment.value}` : `/*${comment.value}*/`;

          if (isDirective(text)) continue;

          context.report({ loc: comment.loc, messageId: "comment" });
        }
      },
    };
  },
  meta: {
    docs: { description: "Disallow comments other than tool directives" },
    messages: {
      comment:
        "Comments are stripped from this codebase (pnpm strip-comments). Say it in the code: a name, a test, or the commit message.",
    },
    type: "problem",
  },
};

const oneFunctionExport = {
  create(context) {
    if (isTestFile(context)) return {};

    const seen = [];

    return {
      ExportNamedDeclaration(node) {
        for (const name of exportedFunctions(node)) {
          if (seen.length > 0) context.report({ data: { name }, messageId: "tooMany", node });

          seen.push(name);
        }
      },
    };
  },
  meta: {
    docs: { description: "Enforce a single exported function per file" },
    messages: {
      tooMany:
        'One exported function per file: found a second export "{{name}}". One function is one file and one spec.',
    },
    type: "problem",
  },
};

const BRANCHING = [
  "DoWhileStatement",
  "ForInStatement",
  "ForOfStatement",
  "ForStatement",
  "IfStatement",
  "SwitchStatement",
  "WhileStatement",
];

const noBranchingExports = {
  create(context) {
    if (isTestFile(context)) return {};

    let current = null;

    const reported = new Set();

    const report = () => {
      if (!current || reported.has(current.name)) return;

      reported.add(current.name);

      context.report({
        data: { name: current.name },
        messageId: "hasBranching",
        node: current.node,
      });
    };

    const listeners = {
      ExportNamedDeclaration(node) {
        const [name] = exportedFunctions(node);

        if (name) current = { name, node };
      },
      "ExportNamedDeclaration:exit"() {
        current = null;
      },
    };

    for (const type of BRANCHING) listeners[type] = report;

    return listeners;
  },
  meta: {
    docs: { description: "Disallow branching inside exported functions of a plumbing layer" },
    messages: {
      hasBranching:
        'Exported function "{{name}}" branches. This layer only wires things together; the decision belongs in a service.',
    },
    type: "problem",
  },
};

const noClasses = {
  create(context) {
    const report = (node) => context.report({ messageId: "classes", node });

    return { ClassDeclaration: report, ClassExpression: report };
  },
  meta: {
    docs: { description: "Disallow classes where the framework does not need them" },
    messages: {
      classes:
        "No classes here. A class is for the folders where the framework needs decorators (controllers, modules, DTOs); everything else is a function.",
    },
    type: "problem",
  },
};

module.exports = {
  meta: { name: "eslint-plugin-local" },
  rules: {
    "no-branching-exports": noBranchingExports,
    "no-classes": noClasses,
    "no-comments": noComments,
    "one-function-export": oneFunctionExport,
  },
};
