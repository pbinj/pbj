# Writing Documentation for PBinJ

This guide explains how to write effective documentation for PBinJ, focusing on code examples and our automated testing system.

## Code Examples

Code examples are crucial for good documentation. In PBinJ, we use a special system to ensure our code examples are always up-to-date and working.
This is done through the use of the `markdown-loader.ts` [vite](https://vitejs.dev/) plugin.   It attempts to transpile and run each example as a [vitest](https://vitest.dev/).  If it fails, the build will fail.   It should ensure that all our code examples are valid and up-to-date with the current version of PBinJ.  In addition it ensures that the sentax is correct.

### Basic Code Examples

For basic code examples that don't need to be tested, use the standard Markdown code block syntax with the `ts` language identifier.  Use this for
examples that are showing code contracts or otherwise would be invalid typescript.  In general this should not be used and `typescript` should be used.

### Testable Code Examples

For code examples that should be automatically tested, use the `typescript` language identifier and include a filename comment. For example:

```typescript
// filename: my-example.ts
import { pbj } from '@pbinj/pbj';

export class MyService {
  doSomething() {
    return 'Hello, PBinJ!';
  }
}

const service = pbj(MyService);
console.log(service.doSomething()); // Output: Hello, PBinJ!
```

The `// filename: my-example.ts` comment is used by our markdown-loader to create a virtual file for testing.

## How the markdown-loader Works

The `markdown-loader.ts` file processes our Markdown documentation and extracts testable code examples. Here's an overview of its operation:

1. Parses the Markdown file and identifies code blocks.
2. Creates a virtual source file for each TypeScript code block.
3. Transpiles the TypeScript code to JavaScript.
4. Generates a test case for each code block.
5. Creates a source map to maintain accurate line numbers for error reporting.

This process ensures that all our code examples are valid and up-to-date with the current version of PBinJ.

## Language Tags: `ts` vs `typescript`

We use different language tags for different purposes:

- `typescript`: Processed by our markdown-loader and included in automated tests.
- `ts`: Treated as a regular code block and not tested.

Use `typescript` for examples that demonstrate PBinJ usage and should be kept up-to-date. Use `ts` for conceptual examples or snippets that don't need to be tested.

## Best Practices

1. Keep examples concise and focused on demonstrating one concept at a time.
2. Use meaningful variable and function names in your examples.
3. Include comments in your code to explain complex parts.
4. Always test your documentation locally before submitting changes.
5. Use `typescript` for code blocks that should be tested, and `ts` for those that shouldn't.

By following these guidelines, you'll help keep our documentation accurate, up-to-date, and valuable for PBinJ users.