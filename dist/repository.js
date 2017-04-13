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
            // model = this.toggleId(model, true);
            const id = new mongodb_1.ObjectID(document.id);
            delete document.id;
            const updates = this.invokeEvents(types_1.PRE_KEY, ['save'], document);
            const res = yield collection
                .findOneAndUpdate({ _id: id }, { $set: updates });
            let newDocument = res.value || document;
            newDocument.id = id.toString();
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
                .findOneAndUpdate(req.conditions, updates, { upsert: req.upsert });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIscUNBQXFGO0FBQ3JGLG1DQUFxRztBQUNyRyw2QkFBZ0M7QUFDaEMsK0NBQTBDO0FBRzFDLElBQWEsZUFBZSxHQUE1QjtJQWlCRSxZQUFvQixFQUFZO1FBQVosT0FBRSxHQUFGLEVBQUUsQ0FBVTtJQUFJLENBQUM7SUFickMsSUFBSSxJQUFJO1FBQ04sTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVTthQUN0QixJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUksVUFBVTtRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQztJQUM1QixDQUFDO0lBSUQsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPO1FBQ3hCLEVBQUUsQ0FBQSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0IsRUFBRSxDQUFBLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDWCxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksa0JBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNyQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sUUFBUSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFD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QUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRXJFLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDekIsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNsQixDQUFDO0tBQUE7SUFFSyxhQUFhLENBQUMsRUFBVTs7WUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3BCLEdBQUcsRUFBRSxJQUFJLGtCQUFRLENBQUMsRUFBRSxDQUFDO2FBQ3RCLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtJQUVLLFNBQVMsQ0FBQyxVQUFlOztZQUM3QixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDekMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUFBO0lBRUssVUFBVSxDQUFDLFVBQWU7O1lBQzlCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN6QyxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQUE7Q0FFRixDQUFBO0FBekpZLGVBQWU7SUFEM0IseUJBQVUsRUFBRTtxQ0FrQmEsYUFBUTtHQWpCckIsZUFBZSxDQXlKM0I7QUF6SlksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0IHsgTkFNRV9LRVksIFBSRV9LRVksIFBPU1RfS0VZLCBVcGRhdGVSZXF1ZXN0LCBVcGRhdGVCeUlkUmVxdWVzdCwgRmluZFJlcXVlc3QgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnLi9kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vbmdvUmVwb3NpdG9yeTxUPiB7XG5cbiAgbG9nZ2VyOiBhbnk7XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShOQU1FX0tFWSwgdGhpcyk7XG4gIH1cblxuICBnZXQgY29sbGVjdGlvbigpOiBQcm9taXNlPENvbGxlY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYi5jb25uZWN0aW9uXG4gICAgICAudGhlbihkYiA9PiBkYi5jb2xsZWN0aW9uKHRoaXMubmFtZSkpO1xuICB9XG5cbiAgZ2V0IGNvbm5lY3Rpb24oKTogUHJvbWlzZTxEYj4ge1xuICAgIHJldHVybiB0aGlzLmRiLmNvbm5lY3Rpb247XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRiOiBEYXRhYmFzZSkgeyB9XG4gIFxuICB0b2dnbGVJZChkb2N1bWVudCwgcmVwbGFjZSk6IGFueSB7XG4gICAgaWYoZG9jdW1lbnQuaWQgfHwgZG9jdW1lbnQuX2lkKSB7XG4gICAgICBpZihyZXBsYWNlKSB7XG4gICAgICAgIGRvY3VtZW50Ll9pZCA9IG5ldyBPYmplY3RJRChkb2N1bWVudC5pZCk7XG4gICAgICAgIGRlbGV0ZSBkb2N1bWVudC5pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmlkID0gZG9jdW1lbnQuX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgIGRlbGV0ZSBkb2N1bWVudC5faWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGludm9rZUV2ZW50cyh0eXBlLCBmbnMsIGRvY3VtZW50KTogYW55IHtcbiAgICBmb3IoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgICBjb25zdCBldmVudHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGAke3R5cGV9XyR7Zm59YCwgdGhpcykgfHwgW107XG4gICAgICBmb3IoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgIGRvY3VtZW50ID0gZXZlbnQoZG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBmaW5kQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZSh7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmUoY29uZGl0aW9uczogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCBjdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoY29uZGl0aW9ucykubGltaXQoMSk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBjdXJzb3IudG9BcnJheSgpO1xuICAgIGlmKHJlcyAmJiByZXMubGVuZ3RoKSB7XG4gICAgICBsZXQgZG9jdW1lbnQgPSByZXNbMF07XG4gICAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50ID0gdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kT25lJ10sIGRvY3VtZW50KTtcbiAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmaW5kKHJlcTogRmluZFJlcXVlc3QgPSB7IGNvbmRpdGlvbnM6IHt9IH0pOiBQcm9taXNlPGFueVtUXT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgXG4gICAgY29uc3QgY29uZGl0aW9ucyAgPSB0aGlzLnRvZ2dsZUlkKHJlcS5jb25kaXRpb25zLCB0cnVlKTtcbiAgICBsZXQgY3Vyc29yID0gY29sbGVjdGlvbi5maW5kKGNvbmRpdGlvbnMpO1xuXG4gICAgaWYgKHJlcS5wcm9qZWN0aW9uKSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3IucHJvamVjdChyZXEucHJvamVjdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5zb3J0KSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3Iuc29ydChyZXEuc29ydCk7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5saW1pdCkge1xuICAgICAgY3Vyc29yID0gY3Vyc29yLmxpbWl0KHJlcS5saW1pdCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3RG9jdW1lbnRzID0gYXdhaXQgY3Vyc29yLnRvQXJyYXkoKTtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG5cbiAgICBmb3IobGV0IGRvY3VtZW50IG9mIG5ld0RvY3VtZW50cykge1xuICAgICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgICByZXN1bHRzLnB1c2godGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kTWFueSddLCBkb2N1bWVudCkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGRvY3VtZW50OiBUKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBkb2N1bWVudCA9IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZScsICdjcmVhdGUnXSwgZG9jdW1lbnQpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb24uaW5zZXJ0T25lKGRvY3VtZW50KTtcblxuICAgIGxldCBuZXdEb2N1bWVudCA9IHJlcy5vcHNbMF07XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKG5ld0RvY3VtZW50LCBmYWxzZSk7XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJywgJ2NyZWF0ZSddLCBuZXdEb2N1bWVudCk7XG4gICAgcmV0dXJuIG5ld0RvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgc2F2ZShkb2N1bWVudDogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICAvLyBtb2RlbCA9IHRoaXMudG9nZ2xlSWQobW9kZWwsIHRydWUpO1xuICAgIGNvbnN0IGlkID0gbmV3IE9iamVjdElEKGRvY3VtZW50LmlkKTtcbiAgICBkZWxldGUgZG9jdW1lbnQuaWQ7XG4gICAgY29uc3QgdXBkYXRlcyA9IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZSddLCBkb2N1bWVudCk7XG4gICAgXG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvblxuICAgICAgLmZpbmRPbmVBbmRVcGRhdGUoeyBfaWQ6IGlkIH0sIHsgJHNldDogdXBkYXRlcyB9KTtcblxuICAgIGxldCBuZXdEb2N1bWVudCA9IHJlcy52YWx1ZSB8fCBkb2N1bWVudDtcbiAgICBuZXdEb2N1bWVudC5pZCA9IGlkLnRvU3RyaW5nKCk7XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJ10sIG5ld0RvY3VtZW50KTtcbiAgICByZXR1cm4gbmV3RG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBmaW5kT25lQnlJZEFuZFVwZGF0ZShpZDogc3RyaW5nLCByZXE6IFVwZGF0ZUJ5SWRSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZUFuZFVwZGF0ZSh7XG4gICAgICBjb25kaXRpb25zOiB7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9LFxuICAgICAgdXBkYXRlczogcmVxLnVwZGF0ZXMsXG4gICAgICB1cHNlcnQ6IHJlcS51cHNlcnRcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmVBbmRVcGRhdGUocmVxOiBVcGRhdGVSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIHJlcS51cGRhdGVzKTtcbiAgICBcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uXG4gICAgICAuZmluZE9uZUFuZFVwZGF0ZShyZXEuY29uZGl0aW9ucywgdXBkYXRlcywgeyB1cHNlcnQ6IHJlcS51cHNlcnQgfSk7XG5cbiAgICBsZXQgZG9jdW1lbnQgPSByZXMudmFsdWU7XG4gICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIGRvY3VtZW50KTtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBkZWxldGVPbmVCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmRlbGV0ZU9uZSh7XG4gICAgICBfaWQ6IG5ldyBPYmplY3RJRChpZClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlT25lKGNvbmRpdGlvbnMpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlTWFueShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlTWFueShjb25kaXRpb25zKTtcbiAgfVxuXG59XG5cbiJdfQ==