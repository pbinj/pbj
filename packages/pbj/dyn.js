async function importFromDataURI(code) {
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);

  const module = await import(/* @vite-ignore */ url);
  URL.revokeObjectURL(url);

  return module;
}

const code = `
  export function hello() {
    console.log("Hello from data URI!");
  }
`;
const module = await importFromDataURI(code);
console.log(module);
module.hello(); // Outputs: "Hello from data URI!"
