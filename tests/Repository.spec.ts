import 'reflect-metadata';
import { MongoRepository } from '../src/Repository';
import { Collection, Before, After } from '../src/Decorators';
import { DatabaseClient } from '../src/DatabaseClient';
import * as mongoMock from 'mongo-mock';
mongoMock.max_delay = 0; // turn of fake async
import { expect } from 'chai';
import * as faker from 'faker';

describe('MongoRepository', () => {
  const dbs = [];

  // Make sure you close all DBs
  // Added this in case of error, CI tests are not hung open
  after(async () => {
    await Promise.all(dbs.map(db => db.close()));
  });

  function getDb(): Promise<DatabaseClient> {
    return new Promise((resolve, reject) => {
      const dbc = new DatabaseClient();
      const MongoClient = mongoMock.MongoClient;
      // unique db for each request
      const uri = `mongodb://${faker.internet.domainName()}:12345/Foo`;
      MongoClient.connect(uri, {}, (err, db) => {
        if (err) reject(err);
        else {
          // dbc.connect(uri, db);
          // Hack until mongo-mock support 3.x driver
          dbc.db = Promise.resolve(db);
          dbs.push(db);
          resolve(dbc);
        }
      });
    });
  }

  describe('CRUD', () => {
    const COLLECTION_NAME = 'Foo';

    interface User {
      name: string;
      title?: string;
    }

    @Collection({
      name: COLLECTION_NAME
    })
    class UserRepository extends MongoRepository<User> {}

    class UserRepositoryNoDecorator extends MongoRepository<User> {}

    it('should create a collection', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const repo = new UserRepository(dbc);

      await repo.collection; // wait for collection to be created

      const collection = mockDb.collection(COLLECTION_NAME);
      expect(collection.collectionName).to.equal(COLLECTION_NAME);
      dbc.close();
    });

    it('should create a collection with supplied options instead of decorator', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const name = COLLECTION_NAME + '_noDecorator';
      const repo = new UserRepositoryNoDecorator(dbc, { name });

      await repo.collection; // wait for collection to be created

      const collection = mockDb.collection(name);
      expect(collection.collectionName).to.equal(name);
      dbc.close();
    });

    it('should throw an error if no collection name is provided', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;

      expect(() => new UserRepositoryNoDecorator(dbc)).to.throw(/No name was provided for this collection/);
      dbc.close();
    });

    it('should reuse an existing collection', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const collection = mockDb.collection(COLLECTION_NAME);
      const user = { name: faker.name.firstName() };
      const record = await collection.insertOne(user);

      const repo = new UserRepository(dbc);
      const foundRecord = await repo.findOne({ name: user.name });
      expect(foundRecord.name).to.deep.equal(record.ops[0].name);
      dbc.close();
    });

    it('should create/save/delete a record', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const repo = new UserRepository(dbc);

      const userObj = {
        name: faker.name.firstName(),
        title: faker.name.jobTitle()
      };

      // Create
      const user = await repo.create(userObj);
      const collection = mockDb.collection(COLLECTION_NAME);
      const foundUser = await collection.findOne({ name: userObj.name });
      expect(foundUser.name).to.equal(userObj.name);
      expect(foundUser).to.haveOwnProperty('_id');

      // Save
      userObj.title = user.title = faker.name.jobTitle();
      const newUser = await repo.save(user);
      expect(newUser.title).to.equal(userObj.title);

      /* Not implemented in mongo-mock
      // Find one by id and update
      // reuse foundUser from above
      userObj.name = faker.name.firstName();
      const updatedUser = await repo.findOneByIdAndUpdate(foundUser._id, {
        updates: {
          $set: {
            name: userObj.name
          }
         }
      });
      expect(updatedUser.name).to.equal(userObj.name);
      */

      /* Not implemented in mongo-mock
      // Find one and update
      userObj.title = faker.name.jobTitle();
      const updatedUser = await repo.findOneAndUpdate({
        conditions: {
          name: userObj.name
        },
        updates: {
          $set: {
            title: userObj.title
          }
         }
      });
      expect(updatedUser.title).to.equal(userObj.title);
      */

      // Delete One by Id
      const deleteOneById = await repo.deleteOneById(foundUser._id);
      expect(deleteOneById.result.n).to.equal(1);

      // Delete One
      await repo.create(userObj); // put user back in
      const deleteOne = await repo.deleteOne({ name: userObj.name });
      expect(deleteOne.result.n).to.equal(1);
      dbc.close();
    });

    xit('should delete many records', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const repo = new UserRepository(dbc);
      const title = faker.name.jobTitle();

      // insert a bunch of documents
      for (let x = 0; x < 10; x++) {
        await repo.create({ name: faker.name.firstName(), title });
      }

      const delRes = await repo.deleteMany({ title });
      expect(delRes.result.n).to.equal(10);
      dbc.close();
    });
  });

  describe('Finding', () => {
    const COLLECTION_NAME = 'People';

    interface Person {
      firstName: string;
      lastName: string;
      title: string;
    }

    @Collection({
      name: COLLECTION_NAME
    })
    class PeopleRepository extends MongoRepository<Person> {}

    async function populateDb(db: any): Promise<any[]> {
      const collection = db.collection(COLLECTION_NAME);
      const people: any[] = [];

      for (let x = 0; x < 10; x++) {
        const res = await collection.insertOne({
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          title: 'fake'
        });
        people.push(...res.ops);
      }

      return people;
    }

    it('should find a record by id', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(dbc);

      const foundPerson = await repo.findById(people[0]._id);
      const collection = await repo.collection;
      expect(foundPerson.firstName).to.equal(people[0].firstName);
      dbc.close();
    });

    it('should find a record by name', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(dbc);

      const foundPerson = await repo.findOne({ firstName: people[0].firstName });
      expect(foundPerson.firstName).to.equal(people[0].firstName);
      dbc.close();
    });

    it('should find multiple records', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(dbc);
      const foundPeople = await repo.find({ conditions: { title: 'fake' } });
      expect(foundPeople.length).to.equal(people.length);
      dbc.close();
    });

    it('should find multiple records by id', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(dbc);
      const foundPeople = await repo.findManyById(people.map(p => p._id.toString()));
      expect(foundPeople.length).to.equal(people.length);
      dbc.close();
    });
  });

  describe('Before/After', () => {
    const COLLECTION_NAME = 'Dogs';

    interface Dog {
      firstName: string;
      type: string;
      good?: boolean;
    }

    @Collection({
      name: COLLECTION_NAME
    })
    class DogRepository extends MongoRepository<Dog> {
      @Before('create')
      async goodBoy(doc: Dog): Promise<Dog> {
        doc.good = true;
        return doc;
      }

      @Before('save')
      async onlyGoodBoys(doc: Dog): Promise<Dog> {
        if ('good' in doc && !doc.good) {
          throw new Error('All dogs are good!');
        }
        return doc;
      }

      @After('find')
      async shout(doc: Dog): Promise<Dog> {
        doc.firstName = doc.firstName.toUpperCase();
        return doc;
      }
    }

    it('should set all new dogs to good', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const repo = new DogRepository(dbc);

      const puppers = await repo.create({ firstName: faker.name.firstName(), type: 'mutt' });
      const foundPup = await repo.findOne({ firstName: puppers.firstName });

      expect(foundPup.firstName).to.equal(puppers.firstName.toUpperCase());
      expect(foundPup.good).to.equal(true);

      dbc.close();
    });

    it('should reject any bad dogs', async () => {
      const dbc = await getDb();
      const mockDb = await dbc.db;
      const repo = new DogRepository(dbc);

      const puppers = await repo.create({ firstName: faker.name.firstName(), type: 'mutt' });
      try {
        const badDog = await repo.save({ ...puppers, good: false });
        throw new Error('We allowed a bad dog!');
      } catch (err) {
        expect(err.message).to.equal('All dogs are good!');
      }

      dbc.close();
    });
  });
});
