import { COLLECTION_KEY, CollectionProps, POST_KEY, PRE_KEY } from './Types';

/**
 * Indicate the class represents a collection
 *
 * @export
 * @param {CollectionProps} props
 * @returns
 */
export function Collection(props: CollectionProps) {
  return function(target: any) {
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
export function Before(...events: string[]) {
  return function(target: any, name: string, descriptor: TypedPropertyDescriptor<any>) {
    for(const event of events) {
      const fns = Reflect.getMetadata(`${PRE_KEY}_${event}`, target) || [];
      fns.push(target[name]);
      Reflect.defineMetadata(`${PRE_KEY}_${event}`, fns, target);
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
export function After(...events: string[]) {
  return function(target: any, name: string, descriptor: TypedPropertyDescriptor<any>) {
    for(const event of events) {
      const fns = Reflect.getMetadata(`${POST_KEY}_${event}`, target) || [];
      fns.push(target[name]);
      Reflect.defineMetadata(`${POST_KEY}_${event}`, fns, target);
    }
  };
}
