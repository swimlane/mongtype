import { Db } from 'mongodb';
export declare class Database {
    private db;
    private uri;
    readonly connection: Promise<Db>;
    connect(uri: any): Promise<Db>;
}
