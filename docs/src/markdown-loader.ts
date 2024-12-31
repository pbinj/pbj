import { marked } from 'marked';
import fs from 'fs/promises';
import * as ts from "typescript";

const transpileOptions: ts.TranspileOptions = {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
  },
};

interface CodeBlock {
  lang: string;
  text: string;
}
const toObjStrMap = (...values:string[])=>{
  return values.reduce((acc, cur, idx)=>`${acc}${JSON.stringify(cur)}:__${idx},`, '{')+'}';
}

export async function parseMarkdownFile(filePath: string): Promise<CodeBlock[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const tokens = marked.lexer(content);
  return tokens
    .filter((token): token is marked.Tokens.Code => token.type === 'code')
    .map(token => ({ lang: token.lang || '', text: token.text }));
}

const plugin = {
  async load(id: string) {
    if (!id.endsWith('.md')) return null;

    const codeBlocks = await parseMarkdownFile(id);
    const testCases = [];
    const importSet = new Set();
    for(const block of codeBlocks) {
      if (block.lang !== 'typescript') continue;
      const index = testCases.length;
       const sourceFile = ts.createSourceFile(
        `${id}-${index}.ts`,
        block.text,
        ts.ScriptTarget.Latest,
        true
      );

      sourceFile.statements.forEach((statement) => {
        if (ts.isImportDeclaration(statement)) {
           const importPath = statement.moduleSpecifier.text;
            importSet.add(importPath);
        }
      });
      const res = ts.transpile(block.text, transpileOptions);

      testCases.push(`
        test('Example ${index + 1}', () => {
          const exports = {};
          ${ts.transpile(block.text, transpileOptions)}
        });
      `);
    }
    return `
      import { test, expect } from 'vitest';
      //fake imports 
      ${Array.from(importSet, (name, idx)=>`import * as __${idx} from '${name}'`).join(';\n')}
      //end fake imports
      const __FAKE_IMPORT_MAP__ = ${toObjStrMap(...importSet)};
      const require = (name) => __FAKE_IMPORT_MAP__[name];

 
      ${testCases.length ? testCases.join('\n') : `test(()=>{expect(true).toBe(true)})`}
    `;
  }
} as const;

if (import.meta.url === `file://${process.argv[1]}`) {
  (async function(){
    for(const arg of process.argv.slice(2)) {
      console.log("#parsing", arg);
      console.log(await plugin.load(arg));
    }
  })().then(undefined,console.error);
}

export default plugin;