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
    }
    get name() {
        return Reflect.getMetadata(types_1.NAME_KEY, this);
    }
    get collection() {
        return this.db.connection
            .then(db => db.collection(this.name));
    }
    get connection() {
        return this.db.connection;
    }
    toggleId(document, replace) {
        if (document.id || document._id) {
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
        for (const fn of fns) {
            const events = Reflect.getMetadata(`${type}_${fn}`, this) || [];
            for (const event of events) {
                document = event(document);
            }
        }
        return document;
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
                document = this.invokeEvents(types_1.POST_KEY, ['find', 'findOne'], document);
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
                results.push(this.invokeEvents(types_1.POST_KEY, ['find', 'findMany'], document));
            }
            return results;
        });
    }
    create(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.collection;
            document = this.invokeEvents(types_1.PRE_KEY, ['save', 'create'], document);
            const res = yield collection.insertOne(document);
            let newDocument = res.ops[0];
            newDocument = this.toggleId(newDocument, false);
            newDocument = this.invokeEvents(types_1.POST_KEY, ['save', 'create'], newDocument);
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
            const updates = this.invokeEvents(types_1.PRE_KEY, ['save'], document);
            const res = yield collection.updateOne({ _id: id }, { $set: updates }, { upsert: true });
            let newDocument = yield collection.findOne({ _id: id });
            // project new items
            if (newDocument) {
                Object.assign(document, newDocument);
            }
            // flip flop ids back
            newDocument.id = id.toString();
            delete newDocument._id;
            newDocument = this.invokeEvents(types_1.POST_KEY, ['save'], newDocument);
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
            const updates = this.invokeEvents(types_1.PRE_KEY, ['update', 'updateOne'], req.updates);
            const res = yield collection
                .findOneAndUpdate(req.conditions, updates, { upsert: req.upsert, returnNewDocument: true });
            let document = res.value;
            document = this.toggleId(document, false);
            document = this.invokeEvents(types_1.POST_KEY, ['update', 'updateOne'], document);
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
};
MongoRepository = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [db_1.Database])
], MongoRepository);
exports.MongoRepository = MongoRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIscUNBQXFGO0FBQ3JGLG1DQUFxRztBQUNyRyw2QkFBZ0M7QUFDaEMsK0NBQTBDO0FBRzFDLElBQWEsZUFBZSxHQUE1QjtJQWVFLFlBQW9CLEVBQVk7UUFBWixPQUFFLEdBQUYsRUFBRSxDQUFVO0lBQUksQ0FBQztJQWJyQyxJQUFJLElBQUk7UUFDTixNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxnQkFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVO2FBQ3RCLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0lBQzVCLENBQUM7SUFJRCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU87UUFDeEIsRUFBRSxDQUFBLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQixFQUFFLENBQUEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNYLFFBQVEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxrQkFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekMsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixRQUFRLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7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QUFVLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQUE7Q0FFRixDQUFBO0FBaEtZLGVBQWU7SUFEM0IseUJBQVUsRUFBRTtxQ0FnQmEsYUFBUTtHQWZyQixlQUFlLENBZ0szQjtBQWhLWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgeyBVcGRhdGVXcml0ZU9wUmVzdWx0LCBPYmplY3RJRCwgTW9uZ29DbGllbnQsIERiLCBDb2xsZWN0aW9uIH0gZnJvbSAnbW9uZ29kYic7XG5pbXBvcnQgeyBOQU1FX0tFWSwgUFJFX0tFWSwgUE9TVF9LRVksIFVwZGF0ZVJlcXVlc3QsIFVwZGF0ZUJ5SWRSZXF1ZXN0LCBGaW5kUmVxdWVzdCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICcuL2RiJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdpbmplY3Rpb24tanMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTW9uZ29SZXBvc2l0b3J5PFQ+IHtcblxuICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKE5BTUVfS0VZLCB0aGlzKTtcbiAgfVxuXG4gIGdldCBjb2xsZWN0aW9uKCk6IFByb21pc2U8Q29sbGVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRiLmNvbm5lY3Rpb25cbiAgICAgIC50aGVuKGRiID0+IGRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKSk7XG4gIH1cblxuICBnZXQgY29ubmVjdGlvbigpOiBQcm9taXNlPERiPiB7XG4gICAgcmV0dXJuIHRoaXMuZGIuY29ubmVjdGlvbjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGI6IERhdGFiYXNlKSB7IH1cbiAgXG4gIHRvZ2dsZUlkKGRvY3VtZW50LCByZXBsYWNlKTogYW55IHtcbiAgICBpZihkb2N1bWVudC5pZCB8fCBkb2N1bWVudC5faWQpIHtcbiAgICAgIGlmKHJlcGxhY2UpIHtcbiAgICAgICAgZG9jdW1lbnQuX2lkID0gbmV3IE9iamVjdElEKGRvY3VtZW50LmlkKTtcbiAgICAgICAgZGVsZXRlIGRvY3VtZW50LmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuaWQgPSBkb2N1bWVudC5faWQudG9TdHJpbmcoKTtcbiAgICAgICAgZGVsZXRlIGRvY3VtZW50Ll9pZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgaW52b2tlRXZlbnRzKHR5cGUsIGZucywgZG9jdW1lbnQpOiBhbnkge1xuICAgIGZvcihjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAgIGNvbnN0IGV2ZW50cyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoYCR7dHlwZX1fJHtmbn1gLCB0aGlzKSB8fCBbXTtcbiAgICAgIGZvcihjb25zdCBldmVudCBvZiBldmVudHMpIHtcbiAgICAgICAgZG9jdW1lbnQgPSBldmVudChkb2N1bWVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGZpbmRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5maW5kT25lKHsgX2lkOiBuZXcgT2JqZWN0SUQoaWQpIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZE9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGNvbnN0IGN1cnNvciA9IGNvbGxlY3Rpb24uZmluZChjb25kaXRpb25zKS5saW1pdCgxKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGN1cnNvci50b0FycmF5KCk7XG4gICAgaWYocmVzICYmIHJlcy5sZW5ndGgpIHtcbiAgICAgIGxldCBkb2N1bWVudCA9IHJlc1swXTtcbiAgICAgIGRvY3VtZW50ID0gdGhpcy50b2dnbGVJZChkb2N1bWVudCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydmaW5kJywgJ2ZpbmRPbmUnXSwgZG9jdW1lbnQpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZpbmQocmVxOiBGaW5kUmVxdWVzdCA9IHsgY29uZGl0aW9uczoge30gfSk6IFByb21pc2U8YW55W1RdPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBcbiAgICBjb25zdCBjb25kaXRpb25zICA9IHRoaXMudG9nZ2xlSWQocmVxLmNvbmRpdGlvbnMsIHRydWUpO1xuICAgIGxldCBjdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoY29uZGl0aW9ucyk7XG5cbiAgICBpZiAocmVxLnByb2plY3Rpb24pIHtcbiAgICAgIGN1cnNvciA9IGN1cnNvci5wcm9qZWN0KHJlcS5wcm9qZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocmVxLnNvcnQpIHtcbiAgICAgIGN1cnNvciA9IGN1cnNvci5zb3J0KHJlcS5zb3J0KTtcbiAgICB9XG5cbiAgICBpZiAocmVxLmxpbWl0KSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3IubGltaXQocmVxLmxpbWl0KTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdEb2N1bWVudHMgPSBhd2FpdCBjdXJzb3IudG9BcnJheSgpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcblxuICAgIGZvcihsZXQgZG9jdW1lbnQgb2YgbmV3RG9jdW1lbnRzKSB7XG4gICAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIHJlc3VsdHMucHVzaCh0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydmaW5kJywgJ2ZpbmRNYW55J10sIGRvY3VtZW50KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZG9jdW1lbnQ6IFQpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGRvY3VtZW50ID0gdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWydzYXZlJywgJ2NyZWF0ZSddLCBkb2N1bWVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvbi5pbnNlcnRPbmUoZG9jdW1lbnQpO1xuXG4gICAgbGV0IG5ld0RvY3VtZW50ID0gcmVzLm9wc1swXTtcbiAgICBuZXdEb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQobmV3RG9jdW1lbnQsIGZhbHNlKTtcbiAgICBuZXdEb2N1bWVudCA9IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ3NhdmUnLCAnY3JlYXRlJ10sIG5ld0RvY3VtZW50KTtcbiAgICByZXR1cm4gbmV3RG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBzYXZlKGRvY3VtZW50OiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIFxuICAgIC8vIGZsaXAvZmxvcCBpZHNcbiAgICBjb25zdCBpZCA9IG5ldyBPYmplY3RJRChkb2N1bWVudC5pZCk7XG4gICAgZGVsZXRlIGRvY3VtZW50LmlkO1xuICAgIGRlbGV0ZSBkb2N1bWVudC5faWQ7XG5cbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWydzYXZlJ10sIGRvY3VtZW50KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uLnVwZGF0ZU9uZSh7IF9pZDogaWQgfSwgeyAkc2V0OiB1cGRhdGVzIH0sIHsgdXBzZXJ0OiB0cnVlIH0pO1xuICAgIGxldCBuZXdEb2N1bWVudCA9IGF3YWl0IGNvbGxlY3Rpb24uZmluZE9uZSh7IF9pZDogaWQgfSk7XG5cbiAgICAvLyBwcm9qZWN0IG5ldyBpdGVtc1xuICAgIGlmKG5ld0RvY3VtZW50KSB7XG4gICAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LCBuZXdEb2N1bWVudCk7XG4gICAgfVxuXG4gICAgLy8gZmxpcCBmbG9wIGlkcyBiYWNrXG4gICAgbmV3RG9jdW1lbnQuaWQgPSBpZC50b1N0cmluZygpO1xuICAgIGRlbGV0ZSBuZXdEb2N1bWVudC5faWQ7XG5cbiAgICBuZXdEb2N1bWVudCA9IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ3NhdmUnXSwgbmV3RG9jdW1lbnQpO1xuICAgIHJldHVybiBuZXdEb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmVCeUlkQW5kVXBkYXRlKGlkOiBzdHJpbmcsIHJlcTogVXBkYXRlQnlJZFJlcXVlc3QpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5maW5kT25lQW5kVXBkYXRlKHtcbiAgICAgIGNvbmRpdGlvbnM6IHsgX2lkOiBuZXcgT2JqZWN0SUQoaWQpIH0sXG4gICAgICB1cGRhdGVzOiByZXEudXBkYXRlcyxcbiAgICAgIHVwc2VydDogcmVxLnVwc2VydFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZE9uZUFuZFVwZGF0ZShyZXE6IFVwZGF0ZVJlcXVlc3QpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLmludm9rZUV2ZW50cyhQUkVfS0VZLCBbJ3VwZGF0ZScsICd1cGRhdGVPbmUnXSwgcmVxLnVwZGF0ZXMpO1xuICAgIFxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb25cbiAgICAgIC5maW5kT25lQW5kVXBkYXRlKHJlcS5jb25kaXRpb25zLCB1cGRhdGVzLCB7IHVwc2VydDogcmVxLnVwc2VydCwgcmV0dXJuTmV3RG9jdW1lbnQ6IHRydWUgfSk7XG5cbiAgICBsZXQgZG9jdW1lbnQgPSByZXMudmFsdWU7XG4gICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIGRvY3VtZW50KTtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBkZWxldGVPbmVCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmRlbGV0ZU9uZSh7XG4gICAgICBfaWQ6IG5ldyBPYmplY3RJRChpZClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlT25lKGNvbmRpdGlvbnMpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlTWFueShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlTWFueShjb25kaXRpb25zKTtcbiAgfVxuXG59XG5cbiJdfQ==