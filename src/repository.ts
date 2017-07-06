import 'reflect-metadata';
import { UpdateWriteOpResult, ObjectID, MongoClient, Db, Collection } from 'mongodb';
import { NAME_KEY, PRE_KEY, POST_KEY, UpdateRequest, UpdateByIdRequest, FindRequest } from './types';
import { Database } from './db';
import { Injectable } from 'injection-js';

@Injectable()
export class MongoRepository<T> {

  get name(): string {
    return Reflect.getMetadata(NAME_KEY, this);
  }

  get collection(): Promise<Collection> {
    return this.db.connection
      .then(db => db.collection(this.name));
  }

  get connection(): Promise<Db> {
    return this.db.connection;
  }

  constructor(private db: Database) { }
  
  toggleId(document, replace): T {
    if(document.id || document._id) {
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

  async invokeEvents(type, fns, document): Promise<T> {
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

  findById(id: string): Promise<T> {
    return this.findOne({ _id: new ObjectID(id) });
  }

  async findOne(conditions: any): Promise<T> {
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

  async find(req: FindRequest = { conditions: {} }): Promise<any[T]> {
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

  async create(document: T): Promise<T> {
    const collection = await this.collection;
    document = await this.invokeEvents(PRE_KEY, ['save', 'create'], document);
    const res = await collection.insertOne(document);

    let newDocument = res.ops[0];
    newDocument = this.toggleId(newDocument, false);
    newDocument = await this.invokeEvents(POST_KEY, ['save', 'create'], newDocument);
    return newDocument;
  }

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

  async findOneByIdAndUpdate(id: string, req: UpdateByIdRequest): Promise<T> {
    return this.findOneAndUpdate({
      conditions: { _id: new ObjectID(id) },
      updates: req.updates,
      upsert: req.upsert
    });
  }

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

  async deleteOneById(id: string): Promise<any> {
    return this.deleteOne({
      _id: new ObjectID(id)
    });
  }

  async deleteOne(conditions: any): Promise<any> {
    const collection = await this.collection;
    return collection.deleteOne(conditions);
  }

  async deleteMany(conditions: any): Promise<any> {
    const collection = await this.collection;
    return collection.deleteMany(conditions);
  }

}
