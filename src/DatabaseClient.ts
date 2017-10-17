import { MongoClient, Db } from 'mongodb';
import * as retry from 'retry';
import { EventEmitter } from 'events';

export class DatabaseClient extends EventEmitter {

  connection: Promise<Db>;
  private uri: string;

  /**
   * Creates an instance of DatabaseClient.
   * @memberof DatabaseClient
   */
  constructor() {
    super();
    this.connection = Promise.reject(new Error('Connect has not been established'));

    this.connection.catch((err) => true);
  }

  /**
   * Connect to the mongodb
   *
   * @param {any} uri The uri of the MongoDB instance
   * @param {(Db|Promise<Db>)} [conn] Optional instantiated MongoDB connection
   * @returns {Promise<Db>}
   * @memberof DatabaseClient
   */
  async connect(uri, conn?: Db|Promise<Db>): Promise<Db> {
    this.uri = uri;

    if(conn !== undefined) {
      this.connection = Promise.resolve(conn);
    } else {
      this.connection = this.createConnection(this.uri);
    }

    return this.connection;
  }

  /**
   * Create a connection to the MongoDB instance
   * Will retry if connection fails initially
   *
   * @private
   * @param {string} uri
   * @returns {Promise<Db>}
   * @memberof DatabaseClient
   */
  private createConnection(uri: string): Promise<Db> {
    return new Promise<Db>((resolve, reject) => {
      const operation = retry.operation();
      operation.attempt(async (attempt) => {
        try {
          const db = await MongoClient.connect(uri);
          this.emit('connected', db);
          resolve(db);
        } catch(e) {
          if (operation.retry(e)) return;
          this.emit('error', e);
          reject(e);
        }
      });
    });
  }

}
