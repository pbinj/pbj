import { marked } from 'marked';
import fs from 'fs/promises';
import * as ts from "typescript";
import { SourceMapGenerator } from 'source-map';

const transpileOptions: ts.TranspileOptions = {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
    sourceMap: true,
  },
};

interface CodeBlock {
  lang: string;
  text: string;
  lineStart: number;
}
const toObjStrMap = (...values:string[])=>{
  return values.reduce((acc, cur, idx)=>`${acc}${JSON.stringify(cur)}:__${idx},`, '{')+'}';
}

export async function parseMarkdownFile(filePath: string): Promise<CodeBlock[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const tokens = marked.lexer(content);
  let lineCount = 1;
  return tokens
    .filter((token): token is marked.Tokens.Code => token.type === 'code')
    .map(token => {
      const block = { lang: token.lang || '', text: token.text, lineStart: lineCount };
      lineCount += token.text.split('\n').length + 1; // +1 for the code fence
      return block;
    });
}

const plugin = {
  async load(id: string) {
    if (!id.endsWith('.md')) return null;

    const codeBlocks = await parseMarkdownFile(id);
    const testCases = [];
    const importSet = new Set();
    const sourceMapGenerator = new SourceMapGenerator({ file: id });
    let generatedLineOffset = 4; // Offset for import statements and other boilerplate

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
          importSet.add(statement.moduleSpecifier.text);
        }
      });

      const transpiledOutput = ts.transpileModule(block.text, {
        ...transpileOptions,
        fileName: `${id}-${index}.ts`,
      });

      const transpiledCode = transpiledOutput.outputText;
      const transpiledMap = JSON.parse(transpiledOutput.sourceMapText || '{}');

      // Adjust source map
      transpiledMap.sources = [id];
      transpiledMap.mappings.split(';').forEach((line: string, lineIndex: number) => {
        line.split(',').forEach((segment: string) => {
          const [column, sourceIndex, sourceLine, sourceColumn] = segment.split('').map(Number);
          if (!isNaN(sourceLine)) {
            sourceMapGenerator.addMapping({
              generated: {
                line: lineIndex + generatedLineOffset,
                column: column || 0
              },
              original: {
                line: sourceLine + block.lineStart,
                column: sourceColumn || 0
              },
              source: id
            });
          }
        });
      });

      testCases.push(`
        test('Example ${index + 1}', async () => {
          const exports = {};
          ${transpiledCode}
        });
      `);

      generatedLineOffset += transpiledCode.split('\n').length + 3; // +3 for test function wrapper
    }

    const output = `
import { test, expect } from 'vitest';
//fake imports 
${Array.from(importSet, (name, idx)=>`import * as __${idx} from '${name}'`).join(';\n')}
//end fake imports
const __FAKE_IMPORT_MAP__ = ${toObjStrMap(...importSet)};
const require = (name) => __FAKE_IMPORT_MAP__[name];

${testCases.length ? testCases.join('\n') : `test(()=>{expect(true).toBe(true)})`}
`;

    return {
      code: output,
      map: sourceMapGenerator.toString()
    };
  }
} as const;

if (import.meta.url === `file://${process.argv[1]}`) {
  (async function(){
    for(const arg of process.argv.slice(2)) {
      console.log((await plugin.load(arg)).code);
    }
  })().then(undefined,console.error);
}

export default plugin;