import {createNewContext, Context} from "./context";


let origContext:Context | undefined;

export function runBeforeEachTest(){
    origContext = (globalThis["__pbj_context"]);
    globalThis['__pbj_context'] = createNewContext();
}

export function runAfterEachTest(){
    globalThis['__pbj_context'] = origContext;
}