"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const mongodb_1 = require("mongodb");
const types_1 = require("./types");
const db_1 = require("./db");
const injection_js_1 = require("injection-js");
let MongoRepository = class MongoRepository {
    constructor(db) {
        this.db = db;
        this.createCollection();
    }
    get connection() {
        return this.db.connection;
    }
    get options() {
        return Reflect.getMetadata(types_1.COLLECTION_KEY, this);
    }
    findById(id) {
        return this.findOne({ _id: new mongodb_1.ObjectID(id) });
    }
    findOne(conditions) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            const cursor = collection.find(conditions).limit(1);
            const res = yield cursor.toArray();
            if (res && res.length) {
                let document = res[0];
                document = this.toggleId(document, false);
                document = yield this.invokeEvents(types_1.POST_KEY, ['find', 'findOne'], document);
                return document;
            }
        });
    }
    find(req = { conditions: {} }) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            const conditions = this.toggleId(req.conditions, true);
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
            const newDocuments = yield cursor.toArray();
            const results = [];
            for (let document of newDocuments) {
                document = this.toggleId(document, false);
                document = yield this.invokeEvents(types_1.POST_KEY, ['find', 'findMany'], document);
                results.push(document);
            }
            return results;
        });
    }
    create(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            document = yield this.invokeEvents(types_1.PRE_KEY, ['save', 'create'], document);
            const res = yield collection.insertOne(document);
            let newDocument = res.ops[0];
            newDocument = this.toggleId(newDocument, false);
            newDocument = yield this.invokeEvents(types_1.POST_KEY, ['save', 'create'], newDocument);
            return newDocument;
        });
    }
    save(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            // flip/flop ids
            const id = new mongodb_1.ObjectID(document.id);
            delete document.id;
            delete document._id;
            const updates = yield this.invokeEvents(types_1.PRE_KEY, ['save'], document);
            const res = yield collection.updateOne({ _id: id }, { $set: updates }, { upsert: true });
            let newDocument = yield collection.findOne({ _id: id });
            // project new items
            if (newDocument) {
                Object.assign(document, newDocument);
            }
            // flip flop ids back
            newDocument.id = id.toString();
            delete newDocument._id;
            newDocument = yield this.invokeEvents(types_1.POST_KEY, ['save'], newDocument);
            return newDocument;
        });
    }
    findOneByIdAndUpdate(id, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOneAndUpdate({
                conditions: { _id: new mongodb_1.ObjectID(id) },
                updates: req.updates,
                upsert: req.upsert
            });
        });
    }
    findOneAndUpdate(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            const updates = yield this.invokeEvents(types_1.PRE_KEY, ['update', 'updateOne'], req.updates);
            const res = yield collection
                .findOneAndUpdate(req.conditions, updates, { upsert: req.upsert, returnNewDocument: true });
            let document = res.value;
            document = this.toggleId(document, false);
            document = yield this.invokeEvents(types_1.POST_KEY, ['update', 'updateOne'], document);
            return document;
        });
    }
    deleteOneById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.deleteOne({
                _id: new mongodb_1.ObjectID(id)
            });
        });
    }
    deleteOne(conditions) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            return collection.deleteOne(conditions);
        });
    }
    deleteMany(conditions) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            return collection.deleteMany(conditions);
        });
    }
    createCollection() {
        this.collection = new Promise((resolve, reject) => {
            this.connection.then((db) => __awaiter(this, void 0, void 0, function* () {
                const collection = db.collection(this.options.name, {
                    size: this.options.size,
                    capped: this.options.capped,
                    max: this.options.max
                });
                resolve(collection);
            }));
        });
    }
    toggleId(document, replace) {
        if (document && (document.id || document._id)) {
            if (replace) {
                document._id = new mongodb_1.ObjectID(document.id);
                delete document.id;
            }
            else {
                document.id = document._id.toString();
                delete document._id;
            }
        }
        return document;
    }
    invokeEvents(type, fns, document) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const fn of fns) {
                const events = Reflect.getMetadata(`${type}_${fn}`, this) || [];
                for (const event of events) {
                    document = event.bind(this)(document);
                    if (typeof document.then === 'function') {
                        document = yield document;
                    }
                }
            }
            return document;
        });
    }
};
MongoRepository = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [db_1.Database])
], MongoRepository);
exports.MongoRepository = MongoRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIscUNBQXFGO0FBQ3JGLG1DQUVpQjtBQUNqQiw2QkFBZ0M7QUFDaEMsK0NBQTBDO0FBRzFDLElBQWEsZUFBZSxHQUE1QjtJQVlFLFlBQW1CLEVBQVk7UUFBWixPQUFFLEdBQUYsRUFBRSxDQUFVO1FBQzdCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFWRCxJQUFJLFVBQVU7UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksT0FBTztRQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLHNCQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQU1ELFFBQVEsQ0FBQyxFQUFVO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksa0JBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVLLE9BQU8sQ0FBQyxVQUFlOztZQUMzQixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDekMsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsRUFBRSxDQUFBLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLFFBQVEs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LE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVhLFlBQVksQ0FBQyxJQUFZLEVBQUUsR0FBYSxFQUFFLFFBQWE7O1lBQ25FLEdBQUcsQ0FBQSxDQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoRSxHQUFHLENBQUEsQ0FBQyxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUMxQixRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDdEMsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7d0JBQ3hDLFFBQVEsR0FBRyxNQUFNLFFBQVEsQ0FBQztvQkFDNUIsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDbEIsQ0FBQztLQUFBO0NBRUYsQ0FBQTtBQWhMWSxlQUFlO0lBRDNCLHlCQUFVLEVBQUU7cUNBYVksYUFBUTtHQVpwQixlQUFlLENBZ0wzQjtBQWhMWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgeyBVcGRhdGVXcml0ZU9wUmVzdWx0LCBPYmplY3RJRCwgTW9uZ29DbGllbnQsIERiLCBDb2xsZWN0aW9uIH0gZnJvbSAnbW9uZ29kYic7XG5pbXBvcnQgeyBcbiAgQ09MTEVDVElPTl9LRVksIFBSRV9LRVksIFBPU1RfS0VZLCBDb2xsZWN0aW9uUHJvcHMsIFVwZGF0ZVJlcXVlc3QsIFVwZGF0ZUJ5SWRSZXF1ZXN0LCBGaW5kUmVxdWVzdCBcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJy4vZGInO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ2luamVjdGlvbi1qcyc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNb25nb1JlcG9zaXRvcnk8VD4ge1xuXG4gIGNvbGxlY3Rpb246IFByb21pc2U8Q29sbGVjdGlvbj47XG4gIFxuICBnZXQgY29ubmVjdGlvbigpOiBQcm9taXNlPERiPiB7XG4gICAgcmV0dXJuIHRoaXMuZGIuY29ubmVjdGlvbjtcbiAgfVxuXG4gIGdldCBvcHRpb25zKCk6IENvbGxlY3Rpb25Qcm9wcyB7XG4gICAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoQ09MTEVDVElPTl9LRVksIHRoaXMpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHVibGljIGRiOiBEYXRhYmFzZSkge1xuICAgIHRoaXMuY3JlYXRlQ29sbGVjdGlvbigpO1xuICB9XG5cbiAgZmluZEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmZpbmRPbmUoeyBfaWQ6IG5ldyBPYmplY3RJRChpZCkgfSk7XG4gIH1cblxuICBhc3luYyBmaW5kT25lKGNvbmRpdGlvbnM6IGFueSk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgY29uc3QgY3Vyc29yID0gY29sbGVjdGlvbi5maW5kKGNvbmRpdGlvbnMpLmxpbWl0KDEpO1xuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgY3Vyc29yLnRvQXJyYXkoKTtcbiAgICBpZihyZXMgJiYgcmVzLmxlbmd0aCkge1xuICAgICAgbGV0IGRvY3VtZW50ID0gcmVzWzBdO1xuICAgICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgICBkb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ2ZpbmQnLCAnZmluZE9uZSddLCBkb2N1bWVudCk7XG4gICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmluZChyZXE6IEZpbmRSZXF1ZXN0ID0geyBjb25kaXRpb25zOiB7fSB9KTogUHJvbWlzZTxhbnlbVF0+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIFxuICAgIGNvbnN0IGNvbmRpdGlvbnMgID0gdGhpcy50b2dnbGVJZChyZXEuY29uZGl0aW9ucywgdHJ1ZSk7XG4gICAgbGV0IGN1cnNvciA9IGNvbGxlY3Rpb24uZmluZChjb25kaXRpb25zKTtcblxuICAgIGlmIChyZXEucHJvamVjdGlvbikge1xuICAgICAgY3Vyc29yID0gY3Vyc29yLnByb2plY3QocmVxLnByb2plY3Rpb24pO1xuICAgIH1cblxuICAgIGlmIChyZXEuc29ydCkge1xuICAgICAgY3Vyc29yID0gY3Vyc29yLnNvcnQocmVxLnNvcnQpO1xuICAgIH1cblxuICAgIGlmIChyZXEubGltaXQpIHtcbiAgICAgIGN1cnNvciA9IGN1cnNvci5saW1pdChyZXEubGltaXQpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld0RvY3VtZW50cyA9IGF3YWl0IGN1cnNvci50b0FycmF5KCk7XG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuXG4gICAgZm9yKGxldCBkb2N1bWVudCBvZiBuZXdEb2N1bWVudHMpIHtcbiAgICAgIGRvY3VtZW50ID0gdGhpcy50b2dnbGVJZChkb2N1bWVudCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydmaW5kJywgJ2ZpbmRNYW55J10sIGRvY3VtZW50KTtcbiAgICAgIHJlc3VsdHMucHVzaChkb2N1bWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZG9jdW1lbnQ6IFQpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGRvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWydzYXZlJywgJ2NyZWF0ZSddLCBkb2N1bWVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvbi5pbnNlcnRPbmUoZG9jdW1lbnQpO1xuXG4gICAgbGV0IG5ld0RvY3VtZW50ID0gcmVzLm9wc1swXTtcbiAgICBuZXdEb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQobmV3RG9jdW1lbnQsIGZhbHNlKTtcbiAgICBuZXdEb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ3NhdmUnLCAnY3JlYXRlJ10sIG5ld0RvY3VtZW50KTtcbiAgICByZXR1cm4gbmV3RG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBzYXZlKGRvY3VtZW50OiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIFxuICAgIC8vIGZsaXAvZmxvcCBpZHNcbiAgICBjb25zdCBpZCA9IG5ldyBPYmplY3RJRChkb2N1bWVudC5pZCk7XG4gICAgZGVsZXRlIGRvY3VtZW50LmlkO1xuICAgIGRlbGV0ZSBkb2N1bWVudC5faWQ7XG5cbiAgICBjb25zdCB1cGRhdGVzID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWydzYXZlJ10sIGRvY3VtZW50KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uLnVwZGF0ZU9uZSh7IF9pZDogaWQgfSwgeyAkc2V0OiB1cGRhdGVzIH0sIHsgdXBzZXJ0OiB0cnVlIH0pO1xuICAgIGxldCBuZXdEb2N1bWVudCA9IGF3YWl0IGNvbGxlY3Rpb24uZmluZE9uZSh7IF9pZDogaWQgfSk7XG5cbiAgICAvLyBwcm9qZWN0IG5ldyBpdGVtc1xuICAgIGlmKG5ld0RvY3VtZW50KSB7XG4gICAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LCBuZXdEb2N1bWVudCk7XG4gICAgfVxuXG4gICAgLy8gZmxpcCBmbG9wIGlkcyBiYWNrXG4gICAgbmV3RG9jdW1lbnQuaWQgPSBpZC50b1N0cmluZygpO1xuICAgIGRlbGV0ZSBuZXdEb2N1bWVudC5faWQ7XG5cbiAgICBuZXdEb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ3NhdmUnXSwgbmV3RG9jdW1lbnQpO1xuICAgIHJldHVybiBuZXdEb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmVCeUlkQW5kVXBkYXRlKGlkOiBzdHJpbmcsIHJlcTogVXBkYXRlQnlJZFJlcXVlc3QpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5maW5kT25lQW5kVXBkYXRlKHtcbiAgICAgIGNvbmRpdGlvbnM6IHsgX2lkOiBuZXcgT2JqZWN0SUQoaWQpIH0sXG4gICAgICB1cGRhdGVzOiByZXEudXBkYXRlcyxcbiAgICAgIHVwc2VydDogcmVxLnVwc2VydFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZE9uZUFuZFVwZGF0ZShyZXE6IFVwZGF0ZVJlcXVlc3QpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGNvbnN0IHVwZGF0ZXMgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQUkVfS0VZLCBbJ3VwZGF0ZScsICd1cGRhdGVPbmUnXSwgcmVxLnVwZGF0ZXMpO1xuICAgIFxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb25cbiAgICAgIC5maW5kT25lQW5kVXBkYXRlKHJlcS5jb25kaXRpb25zLCB1cGRhdGVzLCB7IHVwc2VydDogcmVxLnVwc2VydCwgcmV0dXJuTmV3RG9jdW1lbnQ6IHRydWUgfSk7XG5cbiAgICBsZXQgZG9jdW1lbnQgPSByZXMudmFsdWU7XG4gICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIGRvY3VtZW50KTtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBkZWxldGVPbmVCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmRlbGV0ZU9uZSh7XG4gICAgICBfaWQ6IG5ldyBPYmplY3RJRChpZClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlT25lKGNvbmRpdGlvbnMpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlTWFueShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlTWFueShjb25kaXRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29sbGVjdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb24udGhlbihhc3luYyAoZGIpID0+IHtcbiAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGRiLmNvbGxlY3Rpb24odGhpcy5vcHRpb25zLm5hbWUsIHtcbiAgICAgICAgICBzaXplOiB0aGlzLm9wdGlvbnMuc2l6ZSxcbiAgICAgICAgICBjYXBwZWQ6IHRoaXMub3B0aW9ucy5jYXBwZWQsXG4gICAgICAgICAgbWF4OiB0aGlzLm9wdGlvbnMubWF4XG4gICAgICAgIH0pO1xuICAgICAgICByZXNvbHZlKGNvbGxlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUlkKGRvY3VtZW50OiBhbnksIHJlcGxhY2U6IGJvb2xlYW4pOiBUIHtcbiAgICBpZihkb2N1bWVudCAmJiAoZG9jdW1lbnQuaWQgfHwgZG9jdW1lbnQuX2lkKSkge1xuICAgICAgaWYocmVwbGFjZSkge1xuICAgICAgICBkb2N1bWVudC5faWQgPSBuZXcgT2JqZWN0SUQoZG9jdW1lbnQuaWQpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5pZCA9IGRvY3VtZW50Ll9pZC50b1N0cmluZygpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuX2lkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGludm9rZUV2ZW50cyh0eXBlOiBzdHJpbmcsIGZuczogc3RyaW5nW10sIGRvY3VtZW50OiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBmb3IoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgICBjb25zdCBldmVudHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGAke3R5cGV9XyR7Zm59YCwgdGhpcykgfHwgW107XG4gICAgICBmb3IoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgIGRvY3VtZW50ID0gZXZlbnQuYmluZCh0aGlzKShkb2N1bWVudCk7XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGRvY3VtZW50ID0gYXdhaXQgZG9jdW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbn1cbiJdfQ==