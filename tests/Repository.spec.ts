import 'reflect-metadata';
import { MongoRepository } from '../src/Repository';
import { Collection, Before, After } from '../src/Decorators';
import * as mongoMock from 'mongo-mock';
mongoMock.max_delay = 0; // turn of fake async
import { expect } from 'chai';
import * as faker from 'faker';

describe('MongoRepository', () => {

  function getDb(): Promise<any> {
    return new Promise((resolve, reject) => {
      const MongoClient = mongoMock.MongoClient;
      MongoClient.connect('mongodb://localhost:12345/Foo', {}, (err, db) => {
        if (err) reject(err);
        else resolve(db);
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
    class UserRepository extends MongoRepository<User> { }

    beforeEach((done) => {
      getDb().then((mockDb) =>
        mockDb.dropCollection(COLLECTION_NAME, () => {
          mockDb.close();
          done();
        })
      );
    });

    it('should create a collection', async () => {
      const mockDb = await getDb();
      const repo = new UserRepository(mockDb);

      await repo.collection; // wait for collection to be created

      const collection = mockDb.collection(COLLECTION_NAME);
      expect(collection.collectionName).to.equal(COLLECTION_NAME);
    });

    it('should reuse an existing collection', async () => {
      const mockDb = await getDb();
      const collection = mockDb.collection(COLLECTION_NAME);
      const user = { name: faker.name.firstName() };
      const record = await collection.insertOne(user);

      const repo = new UserRepository(mockDb);
      const foundRecord = await repo.findOne({ name: user.name });
      expect(foundRecord.name).to.deep.equal(record.ops[0].name);
    });

    it('should create/save/delete a record', async () => {
      const mockDb = await getDb();
      const repo = new UserRepository(mockDb);

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

      /* Not implemented in mongo-mock
      // Save
      userObj.title = faker.name.jobTitle();
      const newUser = await repo.save(userObj);
      expect(newUser.title).to.deep.equal(userObj.title);
      */

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
    });

    it('should delete many records', async () => {
      const mockDb = await getDb();
      const repo = new UserRepository(mockDb);
      const title = faker.name.jobTitle();

      // insert a bunch of documents
      for (let x = 0; x < 10; x++) {
        await repo.create({ name: faker.name.firstName(), title });
      }

      const delRes = await repo.deleteMany({ title });
      expect(delRes.result.n).to.equal(10);
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
    class PeopleRepository extends MongoRepository<Person> { }

    beforeEach((done) => {
      getDb().then((mockDb) =>
        mockDb.dropCollection(COLLECTION_NAME, () => {
          mockDb.close();
          done();
        })
      );
    });

    async function populateDb(db: any): Promise<any[]> {
      const mockDb = await getDb();
      const collection = mockDb.collection(COLLECTION_NAME);
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
      const mockDb = await getDb();
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(mockDb);

      const foundPerson = await repo.findById(people[0]._id);
      expect(foundPerson.firstName).to.equal(people[0].firstName);
      mockDb.close();
    });

    it('should find a record by name', async () => {
      const mockDb = await getDb();
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(mockDb);

      const foundPerson = await repo.findOne({ firstName: people[0].firstName });
      expect(foundPerson.firstName).to.equal(people[0].firstName);
      mockDb.close();
    });

    it('should find multiple records', async () => {
      const mockDb = await getDb();
      const people = await populateDb(mockDb);
      const repo = new PeopleRepository(mockDb);

      const foundPeople = await repo.find({ conditions: { title: 'fake' } });
      expect(foundPeople.length).to.equal(people.length);
      mockDb.close();
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

      @After('find')
      async shout(doc: Dog): Promise<Dog> {
        doc.firstName = doc.firstName.toUpperCase();
        return doc;
      }
    }

    beforeEach((done) => {
      getDb().then((mockDb) =>
        mockDb.dropCollection(COLLECTION_NAME, () => {
          mockDb.close();
          done();
        })
      );
    });

    it('should set all new dogs to good', async () => {
      const mockDb = await getDb();
      const repo = new DogRepository(mockDb);

      const puppers = await repo.create({ firstName: faker.name.firstName(), type: 'mutt' });
      expect(puppers.good).to.equal(true);
      mockDb.close();
    });

    it('should UC all dog names on search', async () => {
      const mockDb = await getDb();
      const repo = new DogRepository(mockDb);

      const puppers = await repo.create({ firstName: faker.name.firstName(), type: 'mutt' });
      const foundPup = await repo.findOne({ firstName: puppers.firstName });

      expect(foundPup.firstName).to.equal(puppers.firstName.toUpperCase());

      mockDb.close();
    });

  });
});
