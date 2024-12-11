import { pbjKey, context } from '@pbinj/pbj';

export const metricKey = pbjKey<number>("mymetric");
context.register(metricKey, () => {
    return 1;
});
