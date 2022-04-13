# Upgrade Guide

## 7.x Upgrade Guide

The `MongoRepository` class now requires two type parameters.

- The first param `DOC` is short for "Document" and represents the shape of a document as stored in Mongo, including an `id` member.
- The second type param `DTO` stands for "DTO" and represents the shape of a document during transfer to/from Mongo.

`DTO` SHOULD not have an `id` member because the document may not yet exist in Mongo. `DOC` MUST be a superset of `DTO` and MUST include an `id` member of type `string | ObjectId`.

See [Repository tests](./tests/Repository.spec.ts) for examples.

## 3.x to 4.x Upgrade Guide

Update to Database Client to allow users to provide `MongoClientOptions` to `DatabaseClient.connect()`. This changes the argument order so it's not backwards compatible with Mongtype 3.x

## 2.x to 3.x Upgrade Guide

Mongtype now uses the 3.x branch of the MongoDB native driver!

With the change in the 3.x driver, we've changed `DatabaseClient` to use `MongoClient` and make it available to others.

Now, instead of `DatabaseClient.connection` which resolved to `Db` you have:

- `DatabaseClient.client` that resolves to `MongoClient`
- `DatabaseClient.db` that resolves to `Db`

`MongoRepository` now requires an object that matches the `DBSource` interface (which `DatabaseClient` does)

```typescript
export interface DBSource {
  client: Promise<MongoClient>;
  db: Promise<Db>;
}
```

## 1.x to 2.x Upgrade Guide

### Changes

#### `Database` is now `DatabaseClient`

`Database` has been renamed to `DatabaseClient` to avoid naming collisions and be more clear the use of the class

#### `DatabaseClient.connect()`

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
