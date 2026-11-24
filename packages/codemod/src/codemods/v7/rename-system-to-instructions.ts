import { createTransformer } from '../lib/create-transformer';

// v7 renamed the `system` option to `instructions`. The rename only applies to
// the options object passed to these AI SDK functions (and the `Agent`
// constructor) imported from `ai`.
const TARGET_FUNCTIONS = [
  'generateText',
  'streamText',
  'generateObject',
  'streamObject',
  'Agent',
];

function getName(node: any): string | undefined {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'Literal' || node?.type === 'StringLiteral') {
    return typeof node.value === 'string' ? node.value : undefined;
  }
}

function setName(node: any, name: string) {
  if (node.type === 'Identifier') {
    node.name = name;
  } else if (node.type === 'Literal' || node.type === 'StringLiteral') {
    node.value = name;
  }
}

export default createTransformer((fileInfo, api, options, context) => {
  const { j, root } = context;

  // Collect the local names of the target functions imported from `ai`
  // (handles aliasing, e.g. `import { generateText as gen } from 'ai'`).
  const importedNames = new Set<string>();
  root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'ai')
    .forEach(path => {
      path.node.specifiers?.forEach((specifier: any) => {
        if (
          specifier.type === 'ImportSpecifier' &&
          TARGET_FUNCTIONS.includes(specifier.imported.name)
        ) {
          importedNames.add(specifier.local?.name ?? specifier.imported.name);
        }
      });
    });

  // If the file imports none of the target functions from `ai`, it has no AI
  // SDK call sites to rewrite. Leaving it untouched avoids renaming unrelated
  // `system` keys elsewhere in the project (see #25434).
  if (importedNames.size === 0) {
    return;
  }

  // Rename a top-level `system` property to `instructions` on an options object.
  const renameSystemInObject = (obj: any) => {
    if (!obj || obj.type !== 'ObjectExpression') return;
    obj.properties.forEach((property: any) => {
      if (
        (property.type === 'Property' || property.type === 'ObjectProperty') &&
        getName(property.key) === 'system'
      ) {
        setName(property.key, 'instructions');
        context.hasChanges = true;
      }
    });
  };

  // Resolve a call's first argument to the object literal it refers to: either
  // an inline object (`generateText({ ... })`) or a simple `const options = {
  // ... }` declared in the same file (`generateText(options)`). Anything else
  // (a reassigned or imported identifier, a spread, ...) is left untouched.
  const resolveOptionsObject = (arg: any): any => {
    if (!arg) return undefined;
    if (arg.type === 'ObjectExpression') return arg;
    if (arg.type === 'Identifier') {
      let resolved: any;
      root
        .find(j.VariableDeclarator, {
          id: { type: 'Identifier', name: arg.name },
        })
        .forEach((declPath: any) => {
          if (declPath.node.init?.type === 'ObjectExpression') {
            resolved = declPath.node.init;
          }
        });
      return resolved;
    }
    return undefined;
  };

  const handleCallLike = (node: any) => {
    const callee = node.callee;
    if (callee?.type === 'Identifier' && importedNames.has(callee.name)) {
      renameSystemInObject(resolveOptionsObject(node.arguments?.[0]));
    }
  };

  // `generateText(...)`, `streamText(...)`, ... and `new Agent(...)`.
  root.find(j.CallExpression).forEach(path => handleCallLike(path.node));
  root.find(j.NewExpression).forEach(path => handleCallLike(path.node));
});
