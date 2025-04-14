import {Constructor, ServiceInitI} from "./types";
type InitFn = () => void;

/**
 * Class to handle initialization of services
 */
export class ServiceInit<T extends Constructor> implements ServiceInitI {
    constructor(
        public method: keyof T & string,
        public _factory?: Constructor,
        public initialized = false,
    ) {
        this.factory = _factory;
    }

    private originalInit: InitFn | undefined;

    invalidate() {
        this.initialized = false;
    }
    set factory(_factory: Constructor | undefined) {
        this._factory = _factory;
        if (_factory) {
            // Store the original init method
            this.originalInit = _factory?.prototype?.[this.method];
        } else {
            this.initialized = true;
        }
    }
    /**
     * Invoke the initialization method on the service
     */
    public invoke(scope: InstanceType<T>) {
        if (this.initialized || !this.originalInit || !this.method) {
            return;
        }
        this.initialized = true;
        this.originalInit.call(scope);
        if (this.factory?.prototype) {
            this.factory.prototype[this.method] = this.originalInit;
        }
    }
}
