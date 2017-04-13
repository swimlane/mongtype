import { CollectionProps } from './types';
export declare function Collection(props: CollectionProps): (target: any) => void;
export declare function Before(...events: string[]): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
export declare function After(...events: string[]): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
