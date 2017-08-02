import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from 'injection-js';
import * as retry from 'retry';
import { EventEmitter } from 'events';
import { defer } from './util';

@Injectable()
export class Database extends EventEmitter {

  connection: any;
  private uri: string;

  constructor() {
    super();
    this.connection = defer();
  }

  async connect(uri): Promise<Db> {
    this.uri = uri;
    this.createConnection();
    return this.connection;
  }

  private createConnection(): void {
    const operation = retry.operation();
    operation.attempt(async (attempt) => {
      try {
        const db = await MongoClient.connect(this.uri);
        console.log(`Mongo: Connection opened: ${this.uri}`);
        this.emit('connected', db);
        this.connection.resolve(db);
      } catch(e) {
        if (operation.retry(e)) return;
        console.error('Mongo: Connection error', e);
        this.emit('error', e);
        this.connection.reject(e);
      }
    });
  }

}
