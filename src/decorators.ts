import { NAME_KEY, PRE_KEY, POST_KEY, CollectionProps } from './types';

export function Collection(props: CollectionProps) {
  return function(target: any) {
    Reflect.defineMetadata(NAME_KEY, props.name, target.prototype);
  };
}

export function Before(...events: string[]) {
  return function(target: any, name: string, descriptor: TypedPropertyDescriptor<any>) {
    for(const event of events) {
      const fns = Reflect.getMetadata(`${PRE_KEY}_${event}`, target) || [];
      fns.push(target[name].bind(target));
      Reflect.defineMetadata(`${PRE_KEY}_${event}`, fns, target);
    }
  };
}

export function After(...events: string[]) {
  return function(target: any, name: string, descriptor: TypedPropertyDescriptor<any>) {
    for(const event of events) {
      const fns = Reflect.getMetadata(`${POST_KEY}_${event}`, target) || [];
      fns.push(target[name].bind(target));
      Reflect.defineMetadata(`${POST_KEY}_${event}`, fns, target);
    }
  };
}
