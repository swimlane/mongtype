import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from 'injection-js';
import * as retry from 'retry';

@Injectable()
export class Database {

  private db: Promise<Db>;
  private uri: string;
  
  get connection(): Promise<Db> {
    if (!this.db) {
      const operation = retry.operation();

      operation.attempt((attempt) => {
        this.db = new Promise(async (resolve, reject) => {
          try {
            const db = await MongoClient.connect(this.uri);
            console.log(`Mongo: Connection opened: ${this.uri}`);
            resolve(db);
          } catch(e) {
            if (operation.retry(e)) return;
            console.error('Mongo: Connection error', e);
            reject(e);
          }
        });
      });
    }

    return this.db;
  }

  async connect(uri): Promise<Db> {
    this.uri = uri;
    return this.connection;
  }

}
