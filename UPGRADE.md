# 1.x to 2.x Upgrade Guide

## Changes

### `Database` is now `DatabaseClient`

`Database` has been reneamed to `DatabaseClient` to avoid naming collisions and be more clear the use of the class

### `DatabaseClient.connect()`

The `connect()` method now accepts an instance of `mongodb.Db` to allow for connection pooling and reuse
We left the `uri` option as required in case we want to add a reconnect feature in the future

```typescript
  /**
   * Connect to the mongodb
   *
   * @param {any} uri The uri of the MongoDB instance
   * @param {(Db|Promise<Db>)} [conn] Optional instantiated MongoDB connection
   * @returns {Promise<Db>}
   * @memberof DatabaseClient
   */
  async connect(uri, conn?: Db|Promise<Db>): Promise<Db> { }
```