import { marked, type Tokens } from 'marked';
import fs from 'fs/promises';
import * as ts from "typescript";
import { SourceMapGenerator } from 'source-map';
import * as tsvfs from '@typescript/vfs';
import path from 'path';

const transpileOptions = {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES5,
    sourceMap: true,
    skipLibCheck: true,
    paths: {
      "@pbinj/pbj/*": ["./node_modules/@pbinj/pbj/src/*.ts"],
      "@pbinj/pbj": ["./node_modules/@pbinj/pbj/src/index.ts"]
    }
  },
} as const satisfies ts.TranspileOptions;

interface CodeBlock {
  lang: string;
  text: string;
  lineStart: number;
  filename: string;
}
const toObjStrMap = (...values: string[]) => {
  return values.reduce((acc, cur, idx) => `${acc}${JSON.stringify(cur)}:__${idx},`, '{') + '}';
}

export async function parseMarkdownFile(filePath: string): Promise<CodeBlock[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const tokens = marked.lexer(content);
  let lineCount = 1;
  return tokens
    .filter((token): token is Tokens.Code => token.type === 'code' && token.lang === 'typescript')
    .map((token, index) => {
      const filenameMatch = token.text.match(/\/\/\s*filename\s*=\s*(.+)/);
      const filename = filenameMatch ? filenameMatch[1].trim() : `example-${index}.ts`;
      const text = token.text.replace(/\/\/\s*filename\s*=\s*.+\n/, '');
      const block = { lang: token.lang || '', text, lineStart: lineCount, filename };
      lineCount += token.text.split('\n').length + 1; // +1 for the code fence
      return block;
    });
}

const plugin = {
  async load(file: string) {
    if (!file.endsWith('.md')) return null;
    const codeBlocks = await parseMarkdownFile(file);
    const testCases: string[] = [];
    const importSet = new Set<string>();
    const sourceMapGenerator = new SourceMapGenerator({ file });
    let generatedLineOffset = 4; // Offset for import statements and other boilerplate
    const projectRoot = path.join(__dirname, "..")
    const fsMap = new Map<string, string>();




    const system = tsvfs.createFSBackedSystem(fsMap, projectRoot, ts)
    const env = tsvfs.createVirtualTypeScriptEnvironment(system, [], ts, transpileOptions.compilerOptions)

    const host = tsvfs.createVirtualCompilerHost(system, transpileOptions.compilerOptions, ts)


    const rootNames = [];
    const transpiledMap = new Map<string, string>();
    for (const block of codeBlocks) {
      rootNames.push(block.filename);
      fsMap.set(block.filename.replace('.ts', ''), block.text);
      env.createFile(block.filename, block.text);
    }
    const program = ts.createProgram({
      rootNames,
      options: transpileOptions.compilerOptions,
      host: host.compilerHost,
    });

    try {
      const result = program.emit();
      console.log(result);


    } catch (e) {
      console.error(e);
      throw e;
    }
    const diagnostics = program.getSemanticDiagnostics();
    const diagMap = new Map<string, ts.Diagnostic[]>();
    if (diagnostics.length) {
      for (const diag of diagnostics) {
        if (diag.file?.fileName) {
          diagMap.set(diag.file.fileName || '', (diagMap.get(diag.file.fileName) || []).concat(diag))
        }
      }
    }

    for (const block of codeBlocks) {
      const diags = diagMap.get(block.filename);
      const index = testCases.length + 1;
      if (diags?.length) {
        testCases.push(`test('Example ${index}', () => { throw new Error("Failed to compile TypeScript Block ${index} in (${file}) ${block.filename}\\n${diags.map(d => `${d.code} (${d.start}): ${JSON.stringify(d.messageText)}`).join('\\n')}"); })`);
        continue;
      }

      const sourceFile = program.getSourceFile(block.filename);
      if (!sourceFile) {
        console.error(`Source file not found for ${block.filename}`);
        continue;
      }
      sourceFile.statements.forEach((statement) => {
        if (ts.isImportDeclaration(statement)) {
          if (importSet.size !== importSet.add(statement.moduleSpecifier.getFullText().trim().slice(1, -1)).size) {
            generatedLineOffset++;
          }
        }
      });


      // const transpiledCode = sourceFile.tra
      // const transpiledMap = JSON.parse(transpiledOutput.sourceMapText || '{}');

      // // Adjust source map
      // transpiledMap.sources = [file];
      // transpiledMap.mappings.split(';').forEach((line: string, lineIndex: number) => {
      //   line.split(',').forEach((segment: string) => {
      //     const [column, sourceIndex, sourceLine, sourceColumn] = segment.split('').map(Number);
      //     if (!isNaN(sourceLine)) {
      //       sourceMapGenerator.addMapping({
      //         generated: {
      //           line: lineIndex + generatedLineOffset,
      //           column: column || 0
      //         },
      //         original: {
      //           line: sourceLine + block.lineStart,
      //           column: sourceColumn || 0
      //         },
      //         source: file
      //       });
      //     }
      //   });
      // });
      const transpiledCode = transpiledMap.get(block.filename.replace('/', '').replace('.ts', '.js'));
      testCases.push(`
        test('Example ${index} ${file ? ` (${block.filename})` : ''}', async () => {
          const exports = {};
          ${transpiledCode}
        });
      `);
      if (transpiledCode) {
        generatedLineOffset += transpiledCode?.split('\n').length + 3; // +3 for test function wrapper
      }
    }

    const code = `
import { test, expect } from 'vitest';
${Array.from(importSet, (name, idx) => `import * as __${idx} from '${name}'`).join(';\n')}
const require = ((map)=>(name) => map[name])(${toObjStrMap(...importSet)})

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
