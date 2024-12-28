import { pbjKey } from "./pbjKey.js";
import { serviceSymbol } from "./symbols.js";
import { get } from "./util.js";
export const levels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = typeof levels[number];
export type LogMessage = {
    name: string;
    level: LogLevel;
    message: string;
    context?: unknown;
    timestamp: number;
}
export type LoggerI = {
    [k in LogLevel]: (message:string, obj?:Record<string,unknown>) => void;
}

export const loggerPBinJKey = pbjKey<Logger>("@pbj/logger");

export function formatStr(fmt: string, obj: unknown) {
    return fmt.replace(/{([^}]+)}/g, (match, key) => {
        return get(obj, key) ?? match;
    });
}
interface OnLogMessage {
    (msg: LogMessage[]): void;
}


export class Logger implements LoggerI {

    [serviceSymbol] = loggerPBinJKey;


    _levelIndex = 0;
    _level: LogLevel = 'debug';
    _maxBuffer = 1000;
    _buffer: LogMessage[] = [];
    _listeners: OnLogMessage[] = [];

    constructor(public _console: typeof console | boolean = console, level: LogLevel = "info",
        public name = '@pbj/context',
        private context: object = {},
        public format = formatStr,
        maxBuffer = 1000,
        private parent: Logger | undefined = undefined,
    ) {
        this.level = level;
        this.maxBuffer = maxBuffer;

    }
    createChild(name: string, context = {}) {
        return new Logger(this._console, this.level, name, ({ ...this.context, ...context }), this.format, this.maxBuffer, this);
    }
    private resizeBuffer() {
        if (this._buffer.length > this._maxBuffer) {
            this._buffer = this._buffer.slice(this._buffer.length - this._maxBuffer);
        }
    }
    set maxBuffer(maxBuffer: number) {
        this._maxBuffer = maxBuffer;
        this.resizeBuffer();
    }

    get maxBuffer() {
        return this._maxBuffer;
    }
    set level(level: LogLevel) {
        this._level = level;
        this._levelIndex = levels.indexOf(level);
    }
    get level() {
        return this._level;
    }
    fire(...e: LogMessage[]) {
        this._listeners.forEach(v => v(e));
        if (this.parent) {
            this.parent.fire(...e);
        } else {
            if (this._console) {
                const con = typeof this._console === 'boolean' ? console : this._console;
                e.forEach(v => con.log(
                    `[${v.level}] ${v.name} ${v.timestamp}: ${this.format(v.message, v.context)}`));
            }
            this._buffer.push(...e);
            this.resizeBuffer();
        }
    }
    _log(level: LogLevel, message: string, context: object = {}) {
        this.fire({ name: this.name, level, message, context: { ...this.context, ...context }, timestamp: Date.now() });
    }
    public onLogMessage(fn: (msg: LogMessage[]) => void, init = true) {
        init && fn(this._buffer);
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter((v) => v !== fn);
        }
    }
    debug(message:string, obj?:Record<string,unknown>) {
        this._log("debug", message, obj);
    }
    error(message:string, obj?:Record<string,unknown>) {
        this._log("error", message, obj);
    }
    warn(message:string, obj?:Record<string,unknown>) {
        this._log("warn", message, obj);
    }
    info(message:string, obj?:Record<string,unknown>) {
        this._log("info", message, obj);
    }
}