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
};
MongoRepository = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [db_1.Database])
], MongoRepository);
exports.MongoRepository = MongoRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIscUNBQXFGO0FBQ3JGLG1DQUFxRztBQUNyRyw2QkFBZ0M7QUFDaEMsK0NBQTBDO0FBRzFDLElBQWEsZUFBZSxHQUE1QjtJQWVFLFlBQW9CLEVBQVk7UUFBWixPQUFFLEdBQUYsRUFBRSxDQUFVO0lBQUksQ0FBQztJQWJyQyxJQUFJLElBQUk7UUFDTixNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxnQkFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVO2FBQ3RCLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0lBQzVCLENBQUM7SUFJRCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU87UUFDeEIsRUFBRSxDQUFBLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQixFQUFFLENBQUEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNYLFFBQVEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxrQkFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekMsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixRQUFRLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7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TUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FBQTtJQUVLLFVBQVUsQ0FBQyxVQUFlOztZQUM5QixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDekMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsQ0FBQztLQUFBO0NBRUYsQ0FBQTtBQXBLWSxlQUFlO0lBRDNCLHlCQUFVLEVBQUU7cUNBZ0JhLGFBQVE7R0FmckIsZUFBZSxDQW9LM0I7QUFwS1ksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0IHsgTkFNRV9LRVksIFBSRV9LRVksIFBPU1RfS0VZLCBVcGRhdGVSZXF1ZXN0LCBVcGRhdGVCeUlkUmVxdWVzdCwgRmluZFJlcXVlc3QgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnLi9kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vbmdvUmVwb3NpdG9yeTxUPiB7XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShOQU1FX0tFWSwgdGhpcyk7XG4gIH1cblxuICBnZXQgY29sbGVjdGlvbigpOiBQcm9taXNlPENvbGxlY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYi5jb25uZWN0aW9uXG4gICAgICAudGhlbihkYiA9PiBkYi5jb2xsZWN0aW9uKHRoaXMubmFtZSkpO1xuICB9XG5cbiAgZ2V0IGNvbm5lY3Rpb24oKTogUHJvbWlzZTxEYj4ge1xuICAgIHJldHVybiB0aGlzLmRiLmNvbm5lY3Rpb247XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRiOiBEYXRhYmFzZSkgeyB9XG4gIFxuICB0b2dnbGVJZChkb2N1bWVudCwgcmVwbGFjZSk6IFQge1xuICAgIGlmKGRvY3VtZW50LmlkIHx8IGRvY3VtZW50Ll9pZCkge1xuICAgICAgaWYocmVwbGFjZSkge1xuICAgICAgICBkb2N1bWVudC5faWQgPSBuZXcgT2JqZWN0SUQoZG9jdW1lbnQuaWQpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5pZCA9IGRvY3VtZW50Ll9pZC50b1N0cmluZygpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuX2lkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBpbnZva2VFdmVudHModHlwZSwgZm5zLCBkb2N1bWVudCk6IFByb21pc2U8VD4ge1xuICAgIGZvcihjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAgIGNvbnN0IGV2ZW50cyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoYCR7dHlwZX1fJHtmbn1gLCB0aGlzKSB8fCBbXTtcbiAgICAgIGZvcihjb25zdCBldmVudCBvZiBldmVudHMpIHtcbiAgICAgICAgZG9jdW1lbnQgPSBldmVudC5iaW5kKHRoaXMpKGRvY3VtZW50KTtcbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZG9jdW1lbnQgPSBhd2FpdCBkb2N1bWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBmaW5kQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZSh7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmUoY29uZGl0aW9uczogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCBjdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoY29uZGl0aW9ucykubGltaXQoMSk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBjdXJzb3IudG9BcnJheSgpO1xuICAgIGlmKHJlcyAmJiByZXMubGVuZ3RoKSB7XG4gICAgICBsZXQgZG9jdW1lbnQgPSByZXNbMF07XG4gICAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kT25lJ10sIGRvY3VtZW50KTtcbiAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmaW5kKHJlcTogRmluZFJlcXVlc3QgPSB7IGNvbmRpdGlvbnM6IHt9IH0pOiBQcm9taXNlPGFueVtUXT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgXG4gICAgY29uc3QgY29uZGl0aW9ucyAgPSB0aGlzLnRvZ2dsZUlkKHJlcS5jb25kaXRpb25zLCB0cnVlKTtcbiAgICBsZXQgY3Vyc29yID0gY29sbGVjdGlvbi5maW5kKGNvbmRpdGlvbnMpO1xuXG4gICAgaWYgKHJlcS5wcm9qZWN0aW9uKSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3IucHJvamVjdChyZXEucHJvamVjdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5zb3J0KSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3Iuc29ydChyZXEuc29ydCk7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5saW1pdCkge1xuICAgICAgY3Vyc29yID0gY3Vyc29yLmxpbWl0KHJlcS5saW1pdCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3RG9jdW1lbnRzID0gYXdhaXQgY3Vyc29yLnRvQXJyYXkoKTtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG5cbiAgICBmb3IobGV0IGRvY3VtZW50IG9mIG5ld0RvY3VtZW50cykge1xuICAgICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgICBkb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ2ZpbmQnLCAnZmluZE1hbnknXSwgZG9jdW1lbnQpO1xuICAgICAgcmVzdWx0cy5wdXNoKGRvY3VtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZShkb2N1bWVudDogVCk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgZG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQUkVfS0VZLCBbJ3NhdmUnLCAnY3JlYXRlJ10sIGRvY3VtZW50KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uLmluc2VydE9uZShkb2N1bWVudCk7XG5cbiAgICBsZXQgbmV3RG9jdW1lbnQgPSByZXMub3BzWzBdO1xuICAgIG5ld0RvY3VtZW50ID0gdGhpcy50b2dnbGVJZChuZXdEb2N1bWVudCwgZmFsc2UpO1xuICAgIG5ld0RvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnc2F2ZScsICdjcmVhdGUnXSwgbmV3RG9jdW1lbnQpO1xuICAgIHJldHVybiBuZXdEb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIHNhdmUoZG9jdW1lbnQ6IGFueSk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgXG4gICAgLy8gZmxpcC9mbG9wIGlkc1xuICAgIGNvbnN0IGlkID0gbmV3IE9iamVjdElEKGRvY3VtZW50LmlkKTtcbiAgICBkZWxldGUgZG9jdW1lbnQuaWQ7XG4gICAgZGVsZXRlIGRvY3VtZW50Ll9pZDtcblxuICAgIGNvbnN0IHVwZGF0ZXMgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQUkVfS0VZLCBbJ3NhdmUnXSwgZG9jdW1lbnQpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb24udXBkYXRlT25lKHsgX2lkOiBpZCB9LCB7ICRzZXQ6IHVwZGF0ZXMgfSwgeyB1cHNlcnQ6IHRydWUgfSk7XG4gICAgbGV0IG5ld0RvY3VtZW50ID0gYXdhaXQgY29sbGVjdGlvbi5maW5kT25lKHsgX2lkOiBpZCB9KTtcblxuICAgIC8vIHByb2plY3QgbmV3IGl0ZW1zXG4gICAgaWYobmV3RG9jdW1lbnQpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQsIG5ld0RvY3VtZW50KTtcbiAgICB9XG5cbiAgICAvLyBmbGlwIGZsb3AgaWRzIGJhY2tcbiAgICBuZXdEb2N1bWVudC5pZCA9IGlkLnRvU3RyaW5nKCk7XG4gICAgZGVsZXRlIG5ld0RvY3VtZW50Ll9pZDtcblxuICAgIG5ld0RvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnc2F2ZSddLCBuZXdEb2N1bWVudCk7XG4gICAgcmV0dXJuIG5ld0RvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgZmluZE9uZUJ5SWRBbmRVcGRhdGUoaWQ6IHN0cmluZywgcmVxOiBVcGRhdGVCeUlkUmVxdWVzdCk6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmZpbmRPbmVBbmRVcGRhdGUoe1xuICAgICAgY29uZGl0aW9uczogeyBfaWQ6IG5ldyBPYmplY3RJRChpZCkgfSxcbiAgICAgIHVwZGF0ZXM6IHJlcS51cGRhdGVzLFxuICAgICAgdXBzZXJ0OiByZXEudXBzZXJ0XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmaW5kT25lQW5kVXBkYXRlKHJlcTogVXBkYXRlUmVxdWVzdCk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgY29uc3QgdXBkYXRlcyA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsndXBkYXRlJywgJ3VwZGF0ZU9uZSddLCByZXEudXBkYXRlcyk7XG4gICAgXG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvblxuICAgICAgLmZpbmRPbmVBbmRVcGRhdGUocmVxLmNvbmRpdGlvbnMsIHVwZGF0ZXMsIHsgdXBzZXJ0OiByZXEudXBzZXJ0LCByZXR1cm5OZXdEb2N1bWVudDogdHJ1ZSB9KTtcblxuICAgIGxldCBkb2N1bWVudCA9IHJlcy52YWx1ZTtcbiAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICBkb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBPU1RfS0VZLCBbJ3VwZGF0ZScsICd1cGRhdGVPbmUnXSwgZG9jdW1lbnQpO1xuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU9uZUJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZXRlT25lKHtcbiAgICAgIF9pZDogbmV3IE9iamVjdElEKGlkKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlT25lKGNvbmRpdGlvbnM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5kZWxldGVPbmUoY29uZGl0aW9ucyk7XG4gIH1cblxuICBhc3luYyBkZWxldGVNYW55KGNvbmRpdGlvbnM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5kZWxldGVNYW55KGNvbmRpdGlvbnMpO1xuICB9XG5cbn1cbiJdfQ==