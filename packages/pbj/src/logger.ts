import { get } from "./helpers.js";
import { pbjKey } from "./pbjKey.js";
import { serviceSymbol } from "./symbols.js";

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
    [k in LogLevel]: (<T extends object>(message: MessageFormat<T>, obj: T) => void) | ((message: MessageFormat<{}>) => void);
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

    constructor(public console = true, level: LogLevel = "info",
        public name = '@pbj/context',
        private meta = {},
        public format = formatStr,
        maxBuffer = 1000,
        private parent: Logger | undefined = undefined,
    ) {
        this.level = level;
        this.maxBuffer = maxBuffer;

    }
    createChild(name: string, meta = {}) {
        return new Logger(this.console, this.level, name, ({ ...this.meta, ...meta }), this.format, this.maxBuffer, this);
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
            if (this.console) {
                e.forEach(v => console.log(
                    `[${v.level}] ${v.name} ${v.timestamp}: ${this.format(v.message, v.context)}`));
            }
            this._buffer.push(...e);
            this.resizeBuffer();
        }
    }
    _log(level: LogLevel, message: string, context: object = {}) {
        this.fire({ name: this.name, level, message, context: { ...this.meta, ...context }, timestamp: Date.now() });
    }
    public onLogMessage(fn: (msg: LogMessage[]) => void, init = true) {
        init && fn(this._buffer);
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter((v) => v !== fn);
        }
    }
    debug<T extends object>(...[message, obj]: [MessageFormat<T>, obj: T] | [message: MessageFormat<undefined>]) {
        this._log("debug", message, obj);
    }
    error<T extends object>(...[message, obj]: [MessageFormat<T>, obj: T] | [message: MessageFormat<undefined>]) {
        this._log("error", message, obj);
    }
    warn<T extends object>(...[message, obj]: [MessageFormat<T>, obj: T] | [message: MessageFormat<undefined>]) {
        this._log("warn", message, obj);
    }
    info<T extends object>(...[message, obj]: [MessageFormat<T>, obj: T] | [message: MessageFormat<undefined>]) {
        this._log("info", message, obj);
    }
}


type Primitive = string | number | boolean | null | undefined;

type PathImpl<T, Key extends keyof T> = Key extends string
    ? T[Key] extends Primitive
    ? `${Key}`
    : T[Key] extends object
    ? `${Key}.${PathImpl<T[Key], keyof T[Key]> & string}`
    : never
    : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

type AllowedPaths<T> = Path<T> extends string ? `{${Path<T>}}` : string;

type MessageFormat<T> =
    T extends undefined ? string :
    T extends object
    ? `${string}${AllowedPaths<T>}${string}` | never
    : never;
