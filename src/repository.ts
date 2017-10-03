import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import {
  COLLECTION_KEY, PRE_KEY, POST_KEY, CollectionProps, UpdateRequest, UpdateByIdRequest, FindRequest
} from './types';

export class MongoRepository<T> {

  collection: Promise<Collection>;

  get options(): CollectionProps {
    return Reflect.getMetadata(COLLECTION_KEY, this);
  }

  /**
   * Creates an instance of MongoRepository.
   * @param {Db} db Your MongoDB connection
   * @memberof MongoRepository
   */
  constructor(public db: Db) {
    this.createCollection();
  }

  /**
   * Finds a record by id
   *
   * @param {string} id
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  findById(id: string): Promise<T> {
    return this.findOne({ _id: new ObjectID(id) });
  }

  /**
   * Finds a record by a list of conditions
   *
   * @param {object} conditions
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  async findOne(conditions: object): Promise<T> {
    const collection = await this.collection;
    const cursor = collection.find(conditions).limit(1);

    const res = await cursor.toArray();
    if(res && res.length) {
      let document = res[0];
      document = this.toggleId(document, false);
      document = await this.invokeEvents(POST_KEY, ['find', 'findOne'], document);
      return document;
    }
  }

  /**
   * Find records by a list of conditions
   *
   * @param {FindRequest} [req={ conditions: {} }]
   * @returns {Promise<T[]>}
   * @memberof MongoRepository
   */
  async find(req: FindRequest = { conditions: {} }): Promise<T[]> {
    const collection = await this.collection;

    const conditions  = this.toggleId(req.conditions, true);
    let cursor = collection.find(conditions);

    if (req.projection) {
      cursor = cursor.project(req.projection);
    }

    if (req.sort) {
      cursor = cursor.sort(req.sort);
    }

    if (req.limit) {
      cursor = cursor.limit(req.limit);
    }

    const newDocuments = await cursor.toArray();
    const results = [];

    for(let document of newDocuments) {
      document = this.toggleId(document, false);
      document = await this.invokeEvents(POST_KEY, ['find', 'findMany'], document);
      results.push(document);
    }

    return results;
  }

  /**
   * Create a document of type T
   *
   * @param {T} document
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  async create(document: T): Promise<T> {
    const collection = await this.collection;
    document = await this.invokeEvents(PRE_KEY, ['save', 'create'], document);
    const res = await collection.insertOne(document);

    let newDocument = res.ops[0];
    newDocument = this.toggleId(newDocument, false);
    newDocument = await this.invokeEvents(POST_KEY, ['save', 'create'], newDocument);
    return newDocument;
  }

  /**
   * Save any changes to your document
   *
   * @param {*} document
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  async save(document: any): Promise<T> {
    const collection = await this.collection;

    // flip/flop ids
    const id = new ObjectID(document.id);
    delete document.id;
    delete document._id;

    const updates = await this.invokeEvents(PRE_KEY, ['save'], document);
    const res = await collection.updateOne({ _id: id }, { $set: updates }, { upsert: true });
    let newDocument = await collection.findOne({ _id: id });

    // project new items
    if(newDocument) {
      Object.assign(document, newDocument);
    }

    // flip flop ids back
    newDocument.id = id.toString();
    delete newDocument._id;

    newDocument = await this.invokeEvents(POST_KEY, ['save'], newDocument);
    return newDocument;
  }

  /**
   * Find a record by ID and update with new values
   *
   * @param {string} id
   * @param {UpdateByIdRequest} req
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  async findOneByIdAndUpdate(id: string, req: UpdateByIdRequest): Promise<T> {
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
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  async findOneAndUpdate(req: UpdateRequest): Promise<T> {
    const collection = await this.collection;
    const updates = await this.invokeEvents(PRE_KEY, ['update', 'updateOne'], req.updates);

    const res = await collection
      .findOneAndUpdate(req.conditions, updates, { upsert: req.upsert, returnNewDocument: true });

    let document = res.value;
    document = this.toggleId(document, false);
    document = await this.invokeEvents(POST_KEY, ['update', 'updateOne'], document);
    return document;
  }

  /**
   * Delete a record by ID
   *
   * @param {string} id
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  async deleteOneById(id: string): Promise<any> {
    return this.deleteOne({
      _id: new ObjectID(id)
    });
  }

  /**
   * Delete a record
   *
   * @param {*} conditions
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  async deleteOne(conditions: any): Promise<any> {
    const collection = await this.collection;
    return collection.deleteOne(conditions);
  }

  /**
   * Delete multiple records
   *
   * @param {*} conditions
   * @returns {Promise<any>}
   * @memberof MongoRepository
   */
  async deleteMany(conditions: any): Promise<any> {
    const collection = await this.collection;
    return collection.deleteMany(conditions);
  }

  private createCollection(): void {
    this.collection = this.db.createCollection(this.options.name, {
      size: this.options.size,
      capped: this.options.capped,
      max: this.options.max
    });
  }

  /**
   * Strip off Mongo's ObjectID and replace with string representation or in reverese
   *
   * @private
   * @param {*} document
   * @param {boolean} replace
   * @returns {T}
   * @memberof MongoRepository
   */
  private toggleId(document: any, replace: boolean): T {
    if(document && (document.id || document._id)) {
      if(replace) {
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
   * @param {string[]} fns any of the valid functions: update, updateOne, save, create, find, findOne, findMany
   * @param {*} document The document to apply functions to
   * @returns {Promise<T>}
   * @memberof MongoRepository
   */
  private async invokeEvents(type: string, fns: string[], document: any): Promise<T> {
    for(const fn of fns) {
      const events = Reflect.getMetadata(`${type}_${fn}`, this) || [];
      for(const event of events) {
        document = event.bind(this)(document);
        if (typeof document.then === 'function') {
          document = await document;
        }
      }
    }

    return document;
  }

}
