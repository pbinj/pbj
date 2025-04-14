import {ContextI} from "./context-types";
import {CKey, RegistryType, Returns, ServiceInitI} from "./types";
import {PBinJAsyncError, PBinJError} from "./errors";
import {proxyKey, serviceSymbol} from "./symbols";
import {has, isFn, isPrimitive} from "@pbinj/pbj-guards";
import {asString, isPBinJKey} from "./pbjKey";
import {ServiceDescriptor} from "./service-descriptor";
import {Logger} from "./logger";
import {keyOf} from "./util";
import {newProxy} from "./newProxy";
interface ErrorMsg {
    message: string;
}
export class ServiceContext<TRegistry extends RegistryType, T> {
    static #dependencies = new Set<CKey>();
    private _proxy?: Returns<T>;
    private _factory = false;
    private error:ErrorMsg | undefined;
    constructor(private context: ContextI<TRegistry>,
                public description: ServiceDescriptor<TRegistry, T>,
                private logger = new Logger(),

) {}
   get dependencies() {
        return this.description.dependencies;
    }
   get key(){
        return keyOf(this.description[serviceSymbol]);
   }
   set  args(newArgs: any[]){
        if (this.invoked) {
            this.invalid = true;
        }
        this.invalidate();
        newArgs.forEach((arg) => {
            if (has(arg, proxyKey)) {
                this.addDependency(arg[proxyKey] as CKey);
            }else if (isPBinJKey(arg)) {
                this.addDependency(keyOf(arg));
            }
        });
    }
    /**
     * Invokes the service and returns the value.  This is where the main resolution happens.
     *
     * @returns
     */
    invoke = (): T => {
        if (this.description.interceptors?.length) {
            const invoke = this.description.interceptors?.reduceRight(
                (next: () => Returns<T>, interceptor) => {
                    return () => interceptor.call(this, next);
                },
                ()=>this._invoke(),
            );
            return invoke.call(this);
        }

        return this._invoke();
    };
    invalid = true;
    invoked = false;
    primitive = false;
    _instance?: Returns<T>;
    initializer?: ServiceInitI;

    get initialized() {
        return this.invoked ? this.initializer?.initialized ?? true : false;
    }
    public invalidate(){
        this.invalid = true;
        this.invoked = false;
        this._instance = undefined;
        this.initializer?.invalidate();
    }

    private _promise?: Promise<T> & { resolved?: boolean };
    _invoke = (): Returns<T> => {
        if (this._promise) {
            throw new PBinJAsyncError(this.description[serviceSymbol], this._promise);
        }
        if (!this.description.invokable) {
            return this.description.service as Returns<T>;
        }
        if (!this.invalid && this.invoked && this.description.cacheable) {
            return this._instance as Returns<T>;
        }
        if (!isFn(this.description.service)) {
            this.logger.error(`service '{service}' is not a function`, {
                service: asString(this.description.service as any),
            });
            throw new PBinJError(
                `service '${String(this.description.service)}' is not a function and is not configured as a value, to configure as a value set invokable to false on the service description`,
            );
        }
        let resp;
        const args = this.args.map(v=>{
            if (isPBinJKey(v)) {
                return this.context.resolve(v);
            }
            return v;
        });
        if (this._factory) {
            const val = this.description.service(...args);
            this.addDependency(...ServiceContext.#dependencies);

            if (val instanceof Promise) {
                this._promise = val;
                this.logger.debug("waiting for promise");
                this._promise.then((v) => {
                    this.logger.debug("resolved promise");
                    this._promise = undefined;
                    this.invalid = false;
                    this.invoked = true;
                    this._instance = v as any;
                });
                throw new PBinJAsyncError(this.description[serviceSymbol], val);
            }
            resp = val;
        } else {
            try {
                resp = new (this.description.service as any)(...args);
                this.initializer?.invoke(resp);
                if (this.error) {
                    this.logger.info("service has recovered");
                }
                this.error = undefined;
            } catch (e) {
                const obj = { message: String(e) };
                this.logger.error("error invoking service {message}", obj);
                this.invalidate();
                this.error = obj;
                throw e;
            }
        }

        this.addDependency(...ServiceContext.#dependencies);
        this.invoked = true;
        this.primitive = isPrimitive(resp);
        if (resp == null && !this.description.optional) {
            throw new PBinJError(
                `service '${String(this.description[serviceSymbol])}' is not optional and returned null`,
            );
        }
        if (this.description.cacheable) {
            this._instance = resp;
        }

        return resp;
    };
    addDependency(...keys: CKey[]) {
        if (keys.length) {
            const set = (this.description.dependencies ??= new Set<CKey>());
            keys.forEach((v) => set.add(v));
        }
        return this;
    }
    get proxy(): Returns<T> {
      const key = keyOf(this.description[serviceSymbol]);
      ServiceContext.#dependencies.add(key);
      return (this._proxy ??= newProxy(this));
    }
    toJSON() {
        return {
            ...this.description.toJSON(),
            dependencies: Array.from(this.dependencies ?? [], asString as any),
            error: this.error,
            invoked: this.invoked,
            invalid: this.invalid,
            primitive: this.primitive,
            instance: this._instance,
            factory: this._factory,
        };
    }
}
