
function expressLike() {
    return {
        get() { },
        post() { },
        put() { },
        delete() { },
        use() { },
        listen() { }
    };
}
expressLike.json = () => { };
expressLike.static = () => { };
export default expressLike;