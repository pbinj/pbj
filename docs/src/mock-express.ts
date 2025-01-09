
export function express() {
    return {
        get() { },
        post() { },
        put() { },
        delete() { },
        use() { },
        listen() { }
    } as any;
}
export const json = express.json = express.static = () => { };
export default express;
