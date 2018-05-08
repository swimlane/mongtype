import { EventEmitter } from 'events';
import { Db, MongoClient } from 'mongodb';
import * as retry from 'retry';

import { Deferred } from './Deferred';

export class DatabaseClient extends EventEmitter {

  client: Promise<MongoClient>;
  db: Promise<Db>;

  private uri: string;
  private deferredClient: Deferred<MongoClient>;
  private deferredDb: Deferred<Db>;

  /**
   * Creates an instance of DatabaseClient.
   * @memberof DatabaseClient
   */
  constructor() {
    super();
    this.deferredClient = new Deferred<MongoClient>();
    this.client = this.deferredClient.promise;

    this.deferredDb = new Deferred<Db>();
    this.db = this.deferredDb.promise;
  }

  /**
   * Connect to the mongodb
   *
   * @param {string} uri The uri of the MongoDB instance
   * @param {(MongoClient|Promise<MongoClient>)} [client] Optional instantiated MongoDB connection
   * @returns {Promise<MongoClient>}
   * @memberof DatabaseClient
   */
  async connect(uri: string, client?: MongoClient|Promise<MongoClient>): Promise<Db> {
    this.uri = uri;

    if(client !== undefined) {
      this.deferredClient.resolve(client);
    } else {
      this.deferredClient.resolve(this.createClient(this.uri));
    }

    this.deferredDb.resolve((await this.client).db());
    return this.db;
  }

  /**
   * Close the connection
   *
   * @returns {Promise<void>}
   * @memberof DatabaseClient
   */
  async close(): Promise<void> {
    const client = await this.client;
    return client.close();
  }

  /**
   * Create a connection to the MongoDB instance
   * Will retry if connection fails initially
   *
   * @private
   * @param {string} uri
   * @returns {Promise<MongoClient>}
   * @memberof DatabaseClient
   */
  private createClient(uri: string): Promise<MongoClient> {
    return new Promise<MongoClient>((resolve, reject) => {
      const operation = retry.operation();
      operation.attempt(async (attempt) => {
        try {
          const client = await MongoClient.connect(uri);
          this.emit('connected', client);
          resolve(client);
        } catch(e) {
          if (operation.retry(e)) return;
          this.emit('error', e);
          reject(e);
        }
      });
    });
  }

}
