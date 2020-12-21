import { Collection, DeleteWriteOpResultObject, ObjectID } from 'mongodb';

import {
  COLLECTION_KEY,
  CollectionProps,
  DBSource,
  Document,
  FindRequest,
  POST_KEY,
  PRE_KEY,
  UpdateByIdRequest,
  UpdateRequest,
  RepoEventArgs,
  RepoOperation
} from './Types';

export class MongoRepository<DOC, DTO = DOC> {
  collection: Promise<Collection<DOC>>;
  readonly options: CollectionProps;

  // get options(): CollectionProps {
  //   return Reflect.getMetadata(COLLECTION_KEY, this);
  // }

  /**
   * Creates an instance of MongoRepository.
   * @param {DBSource} dbSource Your MongoDB connection
   * @memberof MongoRepository
   */
  constructor(public dbSource: DBSource, opts?: CollectionProps) {
    this.options = Object.assign({}, opts, Reflect.getMetadata(COLLECTION_KEY, this));
    if (!this.options.name) {
      throw new Error('No name was provided for this collection');
    }
    this.collection = this.getCollection();
  }

  /**
   * Finds a record by id
   *
   * @param {string} id
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  findById(id: string): Promise<DOC> {
    return this.findOne({ _id: new ObjectID(id) });
  }

  /**
   * Find multiple documents by a list of ids
   *
   * @param {string[]} ids
   * @returns {Promise<DOC[]>}
   * @memberof MongoRepository
   */
  async findManyById(ids: string[]): Promise<DOC[]> {
    const collection = await this.collection;
    const query = { _id: { $in: ids.map(id => new ObjectID(id)) } };
    const found = await collection.find(<object>query).toArray();

    const results: DOC[] = [];
    for (const result of found) {
      results.push(
        await this.invokeEvents(POST_KEY, [RepoOperation.find, RepoOperation.findMany], this.toggleId(result, false))
      );
    }

    return results;
  }

  /**
   * Finds a record by a list of conditions
   *
   * @param {object} conditions
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  async findOne(conditions: object): Promise<DOC> {
    const collection = await this.collection;

    let document = await collection.findOne(conditions);
    if (document) {
      document = this.toggleId(document, false);
      document = await this.invokeEvents(POST_KEY, [RepoOperation.find, RepoOperation.findOne], document);
      return document;
    }
  }

  /**
   * Find records by a list of conditions
   *
   * @param {FindRequest} [req={ conditions: {} }]
   * @returns {Promise<PROJECTION[]>}
   * @memberof MongoRepository
   */
  async find<PROJECTION = DOC>(req: FindRequest = { conditions: {} }): Promise<PROJECTION[]> {
    const collection = await this.collection;

    const conditions = this.toggleId(req.conditions, true);
    let cursor = collection.find(conditions);

    if (req.projection) {
      cursor = cursor.project(req.projection);
    }

    if (req.sort) {
      cursor = cursor.sort(req.sort);
    }

    if (req.skip) {
      cursor = cursor.skip(req.skip);
    }

    if (req.limit) {
      cursor = cursor.limit(req.limit);
    }

    const newDocuments = await cursor.toArray();
    const results = [];

    for (let document of newDocuments) {
      document = this.toggleId(document, false);
      document = await this.invokeEvents(POST_KEY, [RepoOperation.find, RepoOperation.findMany], document);
      results.push(document);
    }

    return results;
  }

  /**
   * Create a document of type T
   *
   * @param {DTO} document
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  async create(document: DTO): Promise<DOC> {
    const collection = await this.collection;
    const eventResult = await this.invokeEvents(PRE_KEY, [RepoOperation.save, RepoOperation.create], document);
    const res = await collection.insertOne(eventResult);

    let newDocument = this.toggleId(res.ops[0], false);
    newDocument = await this.invokeEvents(POST_KEY, [RepoOperation.save, RepoOperation.create], newDocument);
    return newDocument;
  }

  /**
   * Save any changes to your document
   *
   * @param {Document} document
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  async save(document: Document): Promise<DOC> {
    const collection = await this.collection;

    // flip/flop ids
    const id = new ObjectID(document.id);

    const updates = await this.invokeEvents(PRE_KEY, [RepoOperation.save], document);
    delete updates['id'];
    delete updates['_id'];
    const query = { _id: id };
    const originalDoc = await this.findOne(<object>query);
    const res = await collection.updateOne(<object>query, { $set: updates }, { upsert: true });
    let newDocument = await collection.findOne(<object>query);

    // project new items
    if (newDocument) {
      Object.assign(document, newDocument);
    }

    // flip flop ids back
    newDocument['id'] = id.toString();
    delete newDocument['_id'];

    newDocument = await this.invokeEvents(POST_KEY, [RepoOperation.save], newDocument, originalDoc);
    return newDocument;
  }

  /**
   * Find a record by ID and update with new values
   *
   * @param {string} id
   * @param {UpdateByIdRequest} req
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  async findOneByIdAndUpdate(id: string, req: UpdateByIdRequest): Promise<DOC> {
    return this.findOneAndUpdate({
      conditions: { _id: new ObjectID(id) },
      updates: req.updates,
      upsert: req.upsert
    });
  }

  /**
   * Find a record and update with new values
   *
   * @param {UpdateRequest} req
   * @returns {Promise<DOC>}
   * @memberof MongoRepository
   */
  async findOneAndUpdate(req: UpdateRequest): Promise<DOC> {
    const collection = await this.collection;
    const updates = await this.invokeEvents(PRE_KEY, [RepoOperation.update, RepoOperation.updateOne], req.updates);

    const originalDoc = await this.findOne(req.conditions);
    if (!req.upsert && !originalDoc) {
      return originalDoc;
    }
    const res = await collection.findOneAndUpdate(req.conditions, updates, {
      upsert: req.upsert,
      returnOriginal: false
    });

    let document = res.value;
    if (document) {
      document = this.toggleId(document, false);
      document = await this.invokeEvents(
        POST_KEY,
        [RepoOperation.update, RepoOperation.updateOne],
        document,
        originalDoc
      );
    }
    return document;
  }

  /**
   * Delete a record by ID
   *
   * @param {string} id
   * @returns {Promise<DeleteWriteOpResultObject>}
   * @memberof MongoRepository
   */
  async deleteOneById(id: string): Promise<DeleteWriteOpResultObject> {
    return this.deleteOne({ _id: new ObjectID(id) });
  }

  /**
   * Delete a record
   *
   * @param {*} conditions
   * @returns {Promise<DeleteWriteOpResultObject>}
   * @memberof MongoRepository
   */
  async deleteOne(conditions: any): Promise<DeleteWriteOpResultObject> {
    const collection = await this.collection;

    let document = await collection.findOne(conditions);
    document = this.toggleId(document, false);
    await this.invokeEvents(PRE_KEY, [RepoOperation.delete, RepoOperation.deleteOne], null, document);
    const deleteResult = await collection.deleteOne(conditions);
    await this.invokeEvents(POST_KEY, [RepoOperation.delete, RepoOperation.deleteOne], null, document);

    return deleteResult;
  }

  /**
   * Delete multiple records
   *
   * @param {*} conditions
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  async deleteMany(conditions: any): Promise<DeleteWriteOpResultObject> {
    const collection = await this.collection;

    const documents = (await collection.find(conditions).toArray()).map(document => {
      return this.toggleId(document, false);
    });

    for (const document of documents) {
      await this.invokeEvents(PRE_KEY, [RepoOperation.delete, RepoOperation.deleteMany], null, document);
    }

    const deleteResult = await collection.deleteMany(conditions);

    for (const document of documents) {
      await this.invokeEvents(POST_KEY, [RepoOperation.delete, RepoOperation.deleteMany], null, document);
    }

    return deleteResult;
  }

  /**
   * Strip off Mongo's ObjectID and replace with string representation or in reverse
   *
   * @private
   * @param {*} document
   * @param {boolean} replace
   * @returns {any}
   * @memberof MongoRepository
   */
  protected toggleId(document: any, replace: boolean): any {
    if (document && (document.id || document._id)) {
      if (replace) {
        document._id = new ObjectID(document.id);
        delete document.id;
      } else {
        document.id = document._id.toString();
        delete document._id;
      }
    }
    return document;
  }

  /**
   * Apply functions to a record based on the type of event
   *
   * @private
   * @param {string} type any of the valid types, PRE_KEY POST_KEY
   * @param {RepoOperation[]} fns any of the valid functions: update, updateOne, save, create, find, findOne, findMany
   * @param {*} newDocument The document to apply functions to
   * @param {*} oldDocument The original document before changes were applied
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  protected async invokeEvents(
    type: string,
    fns: RepoOperation[],
    newDocument: any,
    originalDocument?: any
  ): Promise<any> {
    for (const fn of fns) {
      const events = Reflect.getMetadata(`${type}_${fn}`, this) || [];
      for (const event of events) {
        const repoEventArgs: RepoEventArgs = {
          originalDocument,
          operation: fn,
          operationType: type
        };
        newDocument = event.bind(this)(newDocument, repoEventArgs);
        if (newDocument && typeof newDocument.then === 'function') {
          newDocument = await newDocument;
        }
      }
    }

    return newDocument;
  }

  /**
   * Return a collection
   * If the collection doesn't exist, it will create it with the given options
   *
   * @private
   * @returns {Promise<Collection<DOC>>}
   * @memberof MongoRepository
   */
  private getCollection(): Promise<Collection<DOC>> {
    return new Promise<Collection<DOC>>(async (resolve, reject) => {
      const db = await this.dbSource.db;
      db.collection(this.options.name, { strict: true }, async (err, collection) => {
        let ourCollection = collection;
        if (err) {
          try {
            ourCollection = await db.createCollection(this.options.name, {
              size: this.options.size,
              capped: this.options.capped,
              max: this.options.max
            });
          } catch (createErr) {
            if (createErr.codeName === 'NamespaceExists') {
              // race condition. ignore for now, as I can't seem to get
              // transactions to work in mongo 4.4 as yet
              ourCollection = db.collection(this.options.name);
            } else {
              reject(err);
            }
          }
        }

        // assert indexes
        if (this.options.indexes) {
          for (const indexDefinition of this.options.indexes) {
            try {
              await ourCollection.createIndex(indexDefinition.fields, indexDefinition.options);
            } catch (indexErr) {
              if (
                indexDefinition.overwrite &&
                indexDefinition.options.name &&
                indexErr.name === 'MongoError' &&
                (indexErr.codeName === 'IndexKeySpecsConflict' || indexErr.codeName === 'IndexOptionsConflict')
              ) {
                // drop index and recreate
                try {
                  await ourCollection.dropIndex(indexDefinition.options.name);
                  await ourCollection.createIndex(indexDefinition.fields, indexDefinition.options);
                } catch (recreateErr) {
                  reject(recreateErr);
                }
              } else {
                reject(indexErr);
              }
            }
          }
        }

        resolve(ourCollection);
      });
    });
  }
}
