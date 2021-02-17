import { COLLECTION_KEY, CollectionProps, POST_KEY, PRE_KEY } from './Types';

/**
 * Indicate the class represents a collection
 *
 * @export
 * @param {CollectionProps} props
 * @returns
 */
export function Collection(props: CollectionProps): (target: any) => void {
  return (target: any) => {
    Reflect.defineMetadata(COLLECTION_KEY, props, target.prototype);
  };
}

/**
 * Run this function before an event occurs
 * - create
 * - delete
 * - deleteMany
 * - deleteOne
 * - find
 * - findMany
 * - findOne
 * - save
 * - update
 * - updateOne
 *
 * @export
 * @param {...string[]} events a list of events
 * @returns
 */
export function Before(
  ...events: string[]
): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void {
  return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
    for (const event of events) {
      const fns = Reflect.getMetadata(`${PRE_KEY}_${event}`, target) || [];
      // you must create new array so you don't push fn into siblings
      // see https://github.com/rbuckton/reflect-metadata/issues/53#issuecomment-274906502
      const result = fns ? fns.concat([target[name]]) : [target[name]];
      Reflect.defineMetadata(`${PRE_KEY}_${event}`, result, target);
    }
  };
}

/**
 * Run this function after an event occurs
 * - create
 * - delete
 * - deleteMany
 * - deleteOne
 * - find
 * - findMany
 * - findOne
 * - save
 * - update
 * - updateOne
 *
 * @export
 * @param {...string[]} events a list of events
 * @returns
 */
export function After(
  ...events: string[]
): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void {
  return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
    for (const event of events) {
      const fns = Reflect.getMetadata(`${POST_KEY}_${event}`, target) || [];
      // you must create new array so you don't push fn into siblings
      // see https://github.com/rbuckton/reflect-metadata/issues/53#issuecomment-274906502
      const result = fns ? fns.concat([target[name]]) : [target[name]];
      Reflect.defineMetadata(`${POST_KEY}_${event}`, result, target);
    }
  };
}
