import { Collection, Db, DeleteResult, ObjectId, WithId } from 'mongodb';

const clone = require('rfdc')({ proto: true });

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
  RepoOperation,
  EventOptions,
  IndexDefinition
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
   * @param opts Collection initialize options
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
   * @returns {Promise<WithId<DOC> | null>}
   * @memberof MongoRepository
   */
  findById(id: string): Promise<WithId<DOC> | null> {
    return this.findOne({ _id: new ObjectId(id) });
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
    const query = { _id: { $in: ids.map(id => new ObjectId(id)) } };
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
   * @returns {Promise<WithId<DOC> | null>}
   * @memberof MongoRepository
   */
  async findOne(conditions: object): Promise<WithId<DOC> | null> {
    const collection = await this.collection;

    let document = await collection.findOne(conditions);
    if (document) {
      document = this.toggleId(document, false);
      document = await this.invokeEvents(POST_KEY, [RepoOperation.find, RepoOperation.findOne], document);
    }

    return document;
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

    let newDocument = this.toggleId({ id: res.insertedId }, false);
    newDocument = await this.invokeEvents(POST_KEY, [RepoOperation.save, RepoOperation.create], newDocument);
    return newDocument;
  }

  /**
   * Save any changes to your document
   *
   * @param {Document} document
   * @returns {Promise<WithId<DOC>>}
   * @memberof MongoRepository
   */
  async save(document: Document): Promise<WithId<DOC>> {
    const collection = await this.collection;

    // flip/flop ids
    const id = new ObjectId(document.id);

    const updates = await this.invokeEvents(PRE_KEY, [RepoOperation.save], document);
    delete updates['id'];
    delete updates['_id'];
    const query = { _id: id };
    const originalDoc = await this.findOne(<object>query);
    const res = await collection.updateOne(<object>query, { $set: updates }, { upsert: true });
    let newDocument = await collection.findOne(<object>query);

    // flip flop ids back
    this.toggleId(newDocument, false);

    newDocument = await this.invokeEvents(POST_KEY, [RepoOperation.save], newDocument, originalDoc);

    // project new items
    if (newDocument) {
      Object.assign(document, newDocument);
    }

    return newDocument;
  }

  /**
   * Find a record by ID and update with new values
   *
   * @param {string} id
   * @param {UpdateByIdRequest} req
   * @returns {Promise<WithId<DOC> | null>}
   * @memberof MongoRepository
   */
  async findOneByIdAndUpdate(id: string, req: UpdateByIdRequest): Promise<WithId<DOC> | null> {
    return this.findOneAndUpdate({
      conditions: { _id: new ObjectId(id) },
      updates: req.updates,
      upsert: req.upsert
    });
  }

  /**
   * Find a record and update with new values
   *
   * @param {UpdateRequest} req
   * @returns {Promise<WithId<DOC> | null>}
   * @memberof MongoRepository
   */
  async findOneAndUpdate(req: UpdateRequest): Promise<WithId<DOC> | null> {
    const collection = await this.collection;
    const updates = await this.invokeEvents(PRE_KEY, [RepoOperation.update, RepoOperation.updateOne], req.updates);

    const originalDoc = await this.findOne(req.conditions);
    if (!req.upsert && !originalDoc) {
      return originalDoc;
    }
    const res = await collection.findOneAndUpdate(req.conditions, updates, {
      upsert: req.upsert,
      returnDocument: 'after'
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
   * @returns {Promise<DeleteResult>}
   * @memberof MongoRepository
   */
  async deleteOneById(id: string): Promise<DeleteResult> {
    return this.deleteOne({ _id: new ObjectId(id) });
  }

  /**
   * Delete a record
   *
   * @param {*} conditions
   * @returns {Promise<DeleteResult>}
   * @memberof MongoRepository
   */
  async deleteOne(conditions: any): Promise<DeleteResult> {
    const collection = await this.collection;

    await this.invokeEvents(PRE_KEY, [RepoOperation.delete, RepoOperation.deleteOne], conditions);
    const deleteResult = await collection.deleteOne(conditions);
    await this.invokeEvents(POST_KEY, [RepoOperation.delete, RepoOperation.deleteOne], deleteResult);

    return deleteResult;
  }

  /**
   * Delete multiple records
   *
   * @param {*} conditions
   * @returns {Promise<DeleteResult>}
   * @memberof MongoRepository
   */
  async deleteMany(conditions: any): Promise<DeleteResult> {
    const collection = await this.collection;

    await this.invokeEvents(PRE_KEY, [RepoOperation.delete, RepoOperation.deleteMany], conditions);
    const deleteResult = await collection.deleteMany(conditions);
    await this.invokeEvents(POST_KEY, [RepoOperation.delete, RepoOperation.deleteMany], deleteResult);

    return deleteResult;
  }

  /**
   * Strip off Mongo's ObjectId and replace with string representation or in reverse
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
        document._id = new ObjectId(document.id);
        delete document.id;
      } else {
        document.id = document.id ? document.id.toString() : document._id.toString();
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
   * @param originalDocument The original document before changes were applied
   * @param opts Options for event
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  protected async invokeEvents(
    type: string,
    fns: RepoOperation[],
    newDocument: any,
    originalDocument?: any,
    opts?: EventOptions
  ): Promise<any> {
    // local options override global collection options
    if (opts?.noClone === false || (opts?.noClone === undefined && this.options.eventOpts?.noClone !== true)) {
      // Dereference (aka clone) the target document(s) to
      // prevent down stream modifications in events on the original instance(s)
      this.cloneDocuments(newDocument, originalDocument);
    }

    for (const fn of fns) {
      const events = Reflect.getMetadata(`${type}_${fn}`, this) || [];
      await this.bindEvents(clone(events), fn, type, originalDocument, newDocument);
    }
    return newDocument;
  }

  /**
   * Clone Documents
   *
   * @private
   * @param {*} newDocument The document to apply functions to
   * @param originalDocument The original document before changes were applied
   * @returns {Promise<void>}
   * @memberof MongoRepository
   */
  protected cloneDocuments(newDocument: any, originalDocument: any): void {
    newDocument = clone(newDocument);
    if (originalDocument) {
      originalDocument = clone(originalDocument);
    }
  }

  /**
   * Bind an Event with its options
   *
   * @private
   * @param events list of event which should be binded
   * @param fn a function can be: update, updateOne, save, create, find, findOne, findMany
   * @type {string} type any of the valid types, PRE_KEY POST_KEY
   * @param {*} newDocument The document to apply functions to
   * @param originalDocument The original document before changes were applied
   * @returns {Promise<void>}
   * @memberof MongoRepository
   */
  private async bindEvents(
    events: any,
    fn: RepoOperation,
    type: string,
    originalDocument: any,
    newDocument: any
  ): Promise<void> {
    for (const event of events) {
      const repoEventArgs: RepoEventArgs = {
        originalDocument,
        operation: fn,
        operationType: type
      };
      newDocument = event.bind(this)(newDocument, repoEventArgs);
      if (typeof newDocument.then === 'function') {
        newDocument = await newDocument;
      }
    }
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
      let ourCollection;
      try {
        ourCollection = await db.collection(this.options.name);
      } catch (err) {
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
  }
}
