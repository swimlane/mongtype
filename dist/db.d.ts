/// <reference types="node" />
import { Db } from 'mongodb';
import { EventEmitter } from 'events';
export declare class Database extends EventEmitter {
    connection: any;
    private uri;
    constructor();
    connect(uri: any): Promise<Db>;
    private createConnection();
}
