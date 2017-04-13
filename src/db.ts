import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import { Injectable } from 'injection-js';

@Injectable()
export class Database {

  private db: Promise<Db>;
  private uri: string;
  
  get connection(): Promise<Db> {
    if (!this.db) {
      try {
        this.db = MongoClient.connect(this.uri);
        console.log(`Mongo: Connection opened: ${this.uri}`);
      } catch(e) {
        console.error('Mongo: Connection error', e);
      }
    }

    return this.db;
  }

  async connect(uri): Promise<Db> {
    this.uri = uri;
    return this.connection;
  }

}
