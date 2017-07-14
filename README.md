# MongType
MongoDB Repository pattern for NodeJS written in TypeScript.

## Install
`npm i mongtype --S`

## Building
`npm run build`

## Usage

#### Using DI
```javascript
import { MongoRepository, Collection, Pre, Post, Database } from 'mongtype';
import { Injectable } from 'injection-js';

interface User {
  name: string;
}

@Injectable()
@Collection({
  name: 'user',
  capped: true,
  size: 10000
})
export class UserRepository extends MongoRepository<User> {
  @Before('save')
  doSomethingBeforeSave() {}

  @After('save')
  doSomethingAfterSave() { }
}

@Injectable()
export class App {
  constructor(private db: Database, private userRepo: UserRepository) {
    db.connect('yourconnectionstring');
  }
  
  async findUsers() {
    const one = await this.userRepo.findById('3434-34-34343-3434');
    const many = await this.userRepo.find({ conditions: { name: 'foo' } });
    const newOne = await this.userRepo.create({ foo: true });
    const updated = await this.userRepo.save(newOne);
  }
}
```

#### Without DI
```javascript
const db = new Database();
db.connect('yourconnectionstring');
const svc = new UserRepository(db);

const one = await svc.findById('3434-34-34343-3434');
const many = await svc.find({ conditions: { name: 'foo' } });
const newOne = await svc.create({ foo: true });
const updated = await svc.save(newOne);
```

## Similar
- [ts-mongo](https://github.com/joesonw/ts-mongo/)

## Credits
MongType is a [Swimlane](http://swimlane.com) open-source project; we believe in giving back to the open-source community by sharing some of the projects we build for our application. Swimlane is an automated cyber security operations and incident response platform that enables cyber security teams to leverage threat intelligence, speed up incident response and automate security operations.
