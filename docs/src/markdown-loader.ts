import { marked, type Tokens } from 'marked';
import fs from 'fs/promises';
import * as ts from "typescript";
import { SourceMapGenerator } from 'source-map';
import path from 'path';

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
  fileName?: string;
}
const toObjStrMap = (...values: string[]) => {
  return values.reduce((acc, cur, idx) => `${acc}${JSON.stringify(cur)}:__${idx},`, '{') + '}';
}

export async function parseMarkdownFile(filePath: string): Promise<CodeBlock[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const tokens = marked.lexer(content);
  let lineCount = 1;
  return tokens
    .filter((token): token is Tokens.Code => token.type === 'code')
    .map((token, idx) => {
      const fileName = token.text.match(/^\/\/\s*file:\s*(.*)\n/)?.[1] ?? `${filePath}-${idx}.ts`;
      const block = {
        lang: token.lang || '',
        text: token.text,
        lineStart: lineCount,
        fileName
      };
      lineCount += token.text.split('\n').length + 1; // +1 for the code fence
      return block;
    });
}

const plugin = {
  async load(id: string) {
    if (!id.endsWith('.md')) return null;

    const codeBlocks = await parseMarkdownFile(id);
    const testCases: string[] = [];
    const importSet = new Set<string>();
    const sourceMapGenerator = new SourceMapGenerator({ file: id });
    let generatedLineOffset = 4; // Offset for import statements and other boilerplate

    // Create a map of file names to code blocks for resolving imports
    const fileMap = new Map<string, { block: CodeBlock, index: number }>();
    const mdDir = 'docs/src';

    // First pass: collect all file names
    codeBlocks
      .filter(block => block.lang === 'typescript')
      .forEach((block, idx) => {
        const fileName = block.fileName!;
        // Store both absolute and relative paths for better resolution
        fileMap.set(fileName, { block, index: idx });
        // Also store with full path for absolute imports
        if (!path.isAbsolute(fileName)) {
          const fullPath = path.relative(mdDir, fileName);
          fileMap.set(fullPath, { block, index: idx });
        }
      });

    // Second pass: process each block with file scope awareness
    for (const block of codeBlocks) {
      if (block.lang !== 'typescript') continue;
      const index: number = testCases.length;
      let sourceFile;
      const fileName = block.fileName || `${id}-${index}.ts`;

      try {
        sourceFile = ts.createSourceFile(
            fileName,
            block.text,
            ts.ScriptTarget.Latest,
            true,
        );

      } catch (e) {
        console.error(`Error parsing TypeScript in ${id} at line ${block.lineStart}:`, e);
        testCases.push(`test('Example ${index + 1}', () => { throw new Error("Failed to parse TypeScript Block ${index + 1} in ${id}\n${JSON.stringify(block.text)}\n${JSON.stringify(e)}"); })`);
        continue;
      }

      // Process imports with file scope awareness
      sourceFile.statements.forEach((statement) => {
        if (ts.isImportDeclaration(statement)) {
          generatedLineOffset++;
          const importPath = statement.moduleSpecifier.getFullText().trim().slice(1, -1);

          // Check if this is a relative import that might reference another code block
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            // Resolve the import path relative to the current file
            const resolvedPath = path.relative(path.dirname(fileName), importPath);

            // If we have this file in our map, it's a reference to another code block
            if (fileMap.has(resolvedPath) || fileMap.has(importPath)) {
              // We'll handle this internally, no need to add to importSet
              return;
            }
          }

          // External import, add to importSet
          importSet.add(importPath);
        }
      });

      // Process the code with file scope awareness
      let processedCode = block.text;

      // Replace imports that reference other code blocks
      sourceFile.statements.forEach((statement) => {
        if (ts.isImportDeclaration(statement)) {
          const importPath = statement.moduleSpecifier.getFullText().trim().slice(1, -1);

          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolvedPath = path.relative(path.dirname(fileName), importPath);
            const targetBlock = fileMap.get(resolvedPath) || fileMap.get(importPath);

            if (targetBlock) {
              // Replace the import with a comment that we'll handle in the test case
              const importText = statement.getFullText();
              processedCode = processedCode.replace(importText, `// Resolved import from block ${targetBlock.index + 1}`);
            }
          }
        }
      });

      const transpiledOutput = ts.transpileModule(processedCode, {
        ...transpileOptions,
        fileName,
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

      if (/\.md-\d{1,}\.ts/.test(fileName)) {
        // Create a test case that includes file scope awareness
        testCases.push(`
        test('Example ${index + 1} ', async () => {
          const exports = {};
          const moduleExports = {};
          ${transpiledCode}
          // Store exports for other tests to import
          __fileExports["${fileName}"] = moduleExports;
        });
      `);

        generatedLineOffset += transpiledCode.split('\n').length + 5; // +5 for test function wrapper and exports
      } else {
        generatedLineOffset += transpiledCode.split('\n').length;
      }
    }

    const code = `
import { test, expect, beforeEach, afterEach } from 'vitest';
import {runBeforeEachTest, runAfterEachTest} from "@pbinj/pbj/test";
beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

${Array.from(importSet, (name, idx) => `import * as __${idx} from '${name}'`).join(';\n')}
const require = ((map)=>(name) => map[name])(${toObjStrMap(...importSet)})

// Store exports from each file for cross-file imports
const __fileExports = {};

${testCases.length ? testCases.join('\n') : `test(()=>{expect(true).toBe(true)})`}
`;

    return {
      code,
      map: sourceMapGenerator.toString()
    };
  }
} as const;

//@ts-ignore
if (import.meta.url === `file://${process.argv[1]}`) {
  (async function () {
    for (const arg of process.argv.slice(2)) {
      console.log((await plugin.load(arg))?.code);
    }
  })().then(undefined, console.error);
}

export default plugin;
