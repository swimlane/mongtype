import 'reflect-metadata';
import { Db, Collection } from 'mongodb';
import { CollectionProps, UpdateRequest, UpdateByIdRequest, FindRequest } from './types';
import { Database } from './db';
export declare class MongoRepository<T> {
    db: Database;
    collection: Promise<Collection>;
    readonly connection: Promise<Db>;
    readonly options: CollectionProps;
    constructor(db: Database);
    findById(id: string): Promise<T>;
    findOne(conditions: any): Promise<T>;
    find(req?: FindRequest): Promise<any[T]>;
    create(document: T): Promise<T>;
    save(document: any): Promise<T>;
    findOneByIdAndUpdate(id: string, req: UpdateByIdRequest): Promise<T>;
    findOneAndUpdate(req: UpdateRequest): Promise<T>;
    deleteOneById(id: string): Promise<any>;
    deleteOne(conditions: any): Promise<any>;
    deleteMany(conditions: any): Promise<any>;
    private createCollection();
    private toggleId(document, replace);
    private invokeEvents(type, fns, document);
}
