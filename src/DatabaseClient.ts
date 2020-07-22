import { EventEmitter } from 'events';
import { Db, MongoClient, MongoClientOptions } from 'mongodb';
import * as retry from 'retry';

import { Deferred } from './Deferred';

const retryOptsDefault: retry.OperationOptions = {
  retries: 5,
  factor: 3,
  minTimeout: 1000,
  maxTimeout: 60000,
  randomize: true,
  forever: false,
  maxRetryTime: undefined,
  unref: false
};

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
   * @param uri The uri of the MongoDB instance
   * @param [userOpts] Optional options for your MongoDb connection
   * @param [client] Optional instantiated MongoDB connection
   * @param [retryOptions] Optional retry options for when initial connection fails.
   *  See https://github.com/tim-kos/node-retry#retryoperationoptions
   * @param [onRetryCallback] Optional. Will be invoked with current number of retry
   *  attempts and error reason for current attempt
   * @memberof DatabaseClient
   */
  async connect(
    uri: string,
    userOpts?: MongoClientOptions,
    client?: MongoClient | Promise<MongoClient>,
    retryOptions?: retry.OperationOptions,
    onRetryCallback?: (attempts: number, err: any) => void
  ): Promise<Db> {
    this.uri = uri;

    if (client !== undefined) {
      this.deferredClient.resolve(client);
    } else {
      this.deferredClient.resolve(this.createClient(this.uri, userOpts, retryOptions, onRetryCallback));
    }

    this.deferredDb.resolve((await this.client).db());
    return this.db;
  }

  /**
   * Close the connection
   *
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
   * @param uri
   * @memberof DatabaseClient
   */
  private createClient(
    uri: string,
    userOpts?: MongoClientOptions,
    retryOptions?: retry.OperationOptions,
    onRetryCallback?: (attempts: number, err: any) => void
  ): Promise<MongoClient> {
    return new Promise<MongoClient>((resolve, reject) => {
      const retryOpts = Object.assign({}, retryOptsDefault, retryOptions);
      const operation = retry.operation(retryOpts);
      const opts = Object.assign({}, { useNewUrlParser: true }, userOpts);
      operation.attempt(async attempt => {
        try {
          const client = await MongoClient.connect(uri, opts);
          this.emit('connected', client);
          resolve(client);
        } catch (e) {
          if (operation.retry(e)) {
            if (onRetryCallback) onRetryCallback(attempt, e);
            return;
          }
          this.emit('error', e);
          reject(e);
        }
      });
    });
  }
}
