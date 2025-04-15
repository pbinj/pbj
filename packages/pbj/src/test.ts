import {context, contextProxyKey,Context, createNewContext} from "./context";

let origContext:Context | undefined;

let count = 0;
export function runBeforeEachTest(){
    if (count){
        console.warn('runBeforeEachTest called more than once, before runAfterEachTest');
    }
    console.log('runBeforeEachTest');
    count++;
    //@ts-ignore
    origContext = context[contextProxyKey] as Context;
    //@ts-ignore
    context[contextProxyKey] = createNewContext();

}

export function runAfterEachTest(){
    count--;

    if (count < 0){
        console.warn('runAfterEachTest called more than once, before runBeforeEachTest');
    }
    //@ts-ignore
    context[contextProxyKey] = origContext;
}