import 'reflect-metadata';
import { Db, Collection } from 'mongodb';
import { UpdateRequest, UpdateByIdRequest, FindRequest } from './types';
import { Database } from './db';
export declare class MongoRepository<T> {
    private db;
    readonly name: string;
    readonly collection: Promise<Collection>;
    readonly connection: Promise<Db>;
    constructor(db: Database);
    toggleId(document: any, replace: any): any;
    invokeEvents(type: any, fns: any, document: any): any;
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
}
