import 'reflect-metadata';
import { MongoRepository } from '../src/Repository';
import { Collection } from '../src/Decorators';
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

    it('should create a record', async () => {
      const mockDb = await getDb();
      const repo = new UserRepository(mockDb);

      const user = await repo.create({ name: 'Foo' });

      const collection = mockDb.collection(COLLECTION_NAME);
      const foundUser = await collection.findOne({ name: 'Foo' });
      expect(foundUser.name).to.equal('Foo');
      expect(foundUser).to.haveOwnProperty('_id');
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
});
