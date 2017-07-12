import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from 'injection-js';
import * as retry from 'retry';
import { EventEmitter } from 'events';

@Injectable()
export class Database extends EventEmitter {

  connection: Promise<Db>;
  private uri: string;

  async connect(uri): Promise<Db> {
    this.uri = uri;
    this.connection = this.createConnection();
    return this.connection;
  }

  private createConnection(): Promise<any> {
    const operation = retry.operation();

    return new Promise((resolve, reject) => {
      operation.attempt(async (attempt) => {
        try {
          const db = await MongoClient.connect(this.uri);
          console.log(`Mongo: Connection opened: ${this.uri}`);
          this.emit('connected', db);
          resolve(db);
        } catch(e) {
          if (operation.retry(e)) return;
          console.error('Mongo: Connection error', e);
          this.emit('error', e);
          reject(e);
        }
      });
    });
  }

}
