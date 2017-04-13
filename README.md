# MongType
MongoDB Repository pattern for NodeJS written in TypeScript.

**NOTE: THIS PROJECT IS IN THE EARLY PHASES AND NOT READY FOR PROD USE YET.**.

## Install
`npm i mongtype --S`

## Building
`npm run build`

## Usage

#### Simple
```javascript
import { MongoRepository, Collection, Pre, Post, Database } from 'mongood';

interface User {
  name: string;
}

@Collection({
  name: 'user'
})
export class UserRepository extends MongoRepository<User> {
  @Before('save')
  doSomethingBeforeSave() {}

  @After('save')
  doSomethingAfterSave() { }
}

// Usage
const db = new Database();
db.connect('uri');
const svc = new UserRepository(db);

// CRUD Examples
const one = await svc.findById('3434-34-34343-3434');
const many = await svc.find({ conditions: { name: 'foo' } });
const newOne = await svc.create({ foo: true });
const updated = await svc.save(newOne);
```

#### Example with [injection-js](https://github.com/mgechev/injection-js)
```javascript
import { ReflectiveInjector, Injectable, Injector } from 'injection-js';

const injector = ReflectiveInjector.resolveAndCreate([
  UserRepository, 
  Database,
  MyClass
]);

@Injectable()
export class MyClass {
  constructor(private svc: UserRepository) { }
}

console.log(injector.get(MyClass) instanceof MyClass);
```

## Similar
- [ts-mongo](https://github.com/joesonw/ts-mongo/)

## Credits
MonType is a [Swimlane](http://swimlane.com) open-source project; we believe in giving back to the open-source community by sharing some of the projects we build for our application. Swimlane is an automated cyber security operations and incident response platform that enables cyber security teams to leverage threat intelligence, speed up incident response and automate security operations.