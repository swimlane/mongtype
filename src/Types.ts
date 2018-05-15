import { Db, ObjectID, MongoClient } from 'mongodb';

export const COLLECTION_KEY = 'collection';
export const PRE_KEY = 'pre';
export const POST_KEY = 'post';

export interface UpdateByIdRequest {
  updates: any;
  upsert?: boolean;
}

export interface UpdateRequest extends UpdateByIdRequest {
  conditions: any;
}

export interface FindRequest {
  conditions: any;
  limit?: number;
  projection?: any;
  sort?: any;
}

export interface CollectionProps {
  name: string;
  capped?: boolean;
  size?: number;
  max?: number;
}

export interface Document {
  id?: string | ObjectID;
  [key: string]: any;
}

export interface DBSource {
  client: Promise<MongoClient>;
  db: Promise<Db>;
}
