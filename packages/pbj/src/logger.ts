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
export const loggerPBinJKey = pbjKey<Logger>("@pbj/logger");

export interface OnLogMessage {
    (msg: LogMessage[]): void;
}


export class Logger {

    [serviceSymbol] = loggerPBinJKey;


    _levelIndex = 0;
    _level: LogLevel = 'debug';
    _maxBuffer = 1000;
    _buffer: LogMessage[] = [];

    constructor(public console = true, level: LogLevel = "info", public name = '@pbj/context',
        public format = (msg: LogMessage) => `${this.name} ${msg.level} ${msg.name} ${msg.message}`,
        maxBuffer = 1000,
        private listeners: OnLogMessage[] = []
    ) {
        this.level = level;
        this.maxBuffer = maxBuffer;

    }
    createChild(name: string) {
        return new Logger(this.console, this.level, name, this.format, this.maxBuffer, this.listeners);
    }
    set maxBuffer(maxBuffer: number) {
        this._maxBuffer = maxBuffer;
        if (this._buffer.length > maxBuffer) {
            this._buffer = this._buffer.slice(this._buffer.length - maxBuffer);
        }
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

    _log(level: LogLevel, message: string, context: unknown = {}) {
        const mesg = { name: this.name, level, message, context, timestamp: Date.now() };
        this.listeners.forEach(v => v([mesg]));

        if (this.console && this._levelIndex >= levels.indexOf(level)) {
            console.log(this.format(mesg));
        }
        this._buffer.push(mesg);
        if (this._buffer.length > this.maxBuffer) {
            this._buffer.shift();
        }
    }
    public onLogMessage(fn: (msg: LogMessage[]) => void) {
        fn(this._buffer);
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter((v) => v !== fn);
        }
    }
    debug<T extends unknown>(message: string, obj = {}) {
        this._log("debug", message, obj);
    }
    error(message: string, obj: unknown = {}) {
        this._log("error", message, obj);
    }
    warn(message: string, obj: unknown = {}) {
        this._log("warn", message, obj);
    }
    info(message: string, obj: unknown = {}) {
        this._log("info", message, obj);
    }
}