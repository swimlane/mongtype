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
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQixxQ0FBcUY7QUFDckYsbUNBQXFHO0FBQ3JHLDZCQUFnQztBQUNoQywrQ0FBMEM7QUFHMUMsSUFBYSxlQUFlLEdBQTVCO0lBZUUsWUFBb0IsRUFBWTtRQUFaLE9BQUUsR0FBRixFQUFFLENBQVU7SUFBSSxDQUFDO0lBYnJDLElBQUksSUFBSTtRQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELElBQUksVUFBVTtRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVU7YUFDdEIsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7SUFDNUIsQ0FBQztJQUlELFFBQVEsQ0FBQyxRQUFRLEVBQUUsT0FBTztRQUN4QixFQUFFLENBQUEsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9CLEVBQUUsQ0FBQSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLGtCQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QyxPQUFPLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDckIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLFFBQVEsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztn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QztLQUFBO0NBRUYsQ0FBQTtBQWhLWSxlQUFlO0lBRDNCLHlCQUFVLEVBQUU7cUNBZ0JhLGFBQVE7R0FmckIsZUFBZSxDQWdLM0I7QUFoS1ksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0IHsgTkFNRV9LRVksIFBSRV9LRVksIFBPU1RfS0VZLCBVcGRhdGVSZXF1ZXN0LCBVcGRhdGVCeUlkUmVxdWVzdCwgRmluZFJlcXVlc3QgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnLi9kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vbmdvUmVwb3NpdG9yeTxUPiB7XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShOQU1FX0tFWSwgdGhpcyk7XG4gIH1cblxuICBnZXQgY29sbGVjdGlvbigpOiBQcm9taXNlPENvbGxlY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYi5jb25uZWN0aW9uXG4gICAgICAudGhlbihkYiA9PiBkYi5jb2xsZWN0aW9uKHRoaXMubmFtZSkpO1xuICB9XG5cbiAgZ2V0IGNvbm5lY3Rpb24oKTogUHJvbWlzZTxEYj4ge1xuICAgIHJldHVybiB0aGlzLmRiLmNvbm5lY3Rpb247XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRiOiBEYXRhYmFzZSkgeyB9XG4gIFxuICB0b2dnbGVJZChkb2N1bWVudCwgcmVwbGFjZSk6IGFueSB7XG4gICAgaWYoZG9jdW1lbnQuaWQgfHwgZG9jdW1lbnQuX2lkKSB7XG4gICAgICBpZihyZXBsYWNlKSB7XG4gICAgICAgIGRvY3VtZW50Ll9pZCA9IG5ldyBPYmplY3RJRChkb2N1bWVudC5pZCk7XG4gICAgICAgIGRlbGV0ZSBkb2N1bWVudC5pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmlkID0gZG9jdW1lbnQuX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgIGRlbGV0ZSBkb2N1bWVudC5faWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGludm9rZUV2ZW50cyh0eXBlLCBmbnMsIGRvY3VtZW50KTogYW55IHtcbiAgICBmb3IoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgICBjb25zdCBldmVudHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGAke3R5cGV9XyR7Zm59YCwgdGhpcykgfHwgW107XG4gICAgICBmb3IoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgIGRvY3VtZW50ID0gZXZlbnQoZG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBmaW5kQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZSh7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmUoY29uZGl0aW9uczogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCBjdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoY29uZGl0aW9ucykubGltaXQoMSk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBjdXJzb3IudG9BcnJheSgpO1xuICAgIGlmKHJlcyAmJiByZXMubGVuZ3RoKSB7XG4gICAgICBsZXQgZG9jdW1lbnQgPSByZXNbMF07XG4gICAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50ID0gdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kT25lJ10sIGRvY3VtZW50KTtcbiAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmaW5kKHJlcTogRmluZFJlcXVlc3QgPSB7IGNvbmRpdGlvbnM6IHt9IH0pOiBQcm9taXNlPGFueVtUXT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgXG4gICAgY29uc3QgY29uZGl0aW9ucyAgPSB0aGlzLnRvZ2dsZUlkKHJlcS5jb25kaXRpb25zLCB0cnVlKTtcbiAgICBsZXQgY3Vyc29yID0gY29sbGVjdGlvbi5maW5kKGNvbmRpdGlvbnMpO1xuXG4gICAgaWYgKHJlcS5wcm9qZWN0aW9uKSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3IucHJvamVjdChyZXEucHJvamVjdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5zb3J0KSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3Iuc29ydChyZXEuc29ydCk7XG4gICAgfVxuXG4gICAgaWYgKHJlcS5saW1pdCkge1xuICAgICAgY3Vyc29yID0gY3Vyc29yLmxpbWl0KHJlcS5saW1pdCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3RG9jdW1lbnRzID0gYXdhaXQgY3Vyc29yLnRvQXJyYXkoKTtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG5cbiAgICBmb3IobGV0IGRvY3VtZW50IG9mIG5ld0RvY3VtZW50cykge1xuICAgICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgICByZXN1bHRzLnB1c2godGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kTWFueSddLCBkb2N1bWVudCkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGRvY3VtZW50OiBUKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBkb2N1bWVudCA9IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZScsICdjcmVhdGUnXSwgZG9jdW1lbnQpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb24uaW5zZXJ0T25lKGRvY3VtZW50KTtcblxuICAgIGxldCBuZXdEb2N1bWVudCA9IHJlcy5vcHNbMF07XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKG5ld0RvY3VtZW50LCBmYWxzZSk7XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJywgJ2NyZWF0ZSddLCBuZXdEb2N1bWVudCk7XG4gICAgcmV0dXJuIG5ld0RvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgc2F2ZShkb2N1bWVudDogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBcbiAgICAvLyBmbGlwL2Zsb3AgaWRzXG4gICAgY29uc3QgaWQgPSBuZXcgT2JqZWN0SUQoZG9jdW1lbnQuaWQpO1xuICAgIGRlbGV0ZSBkb2N1bWVudC5pZDtcbiAgICBkZWxldGUgZG9jdW1lbnQuX2lkO1xuXG4gICAgY29uc3QgdXBkYXRlcyA9IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZSddLCBkb2N1bWVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvbi51cGRhdGVPbmUoeyBfaWQ6IGlkIH0sIHsgJHNldDogdXBkYXRlcyB9LCB7IHVwc2VydDogdHJ1ZSB9KTtcbiAgICBsZXQgbmV3RG9jdW1lbnQgPSBhd2FpdCBjb2xsZWN0aW9uLmZpbmRPbmUoeyBfaWQ6IGlkIH0pO1xuXG4gICAgLy8gcHJvamVjdCBuZXcgaXRlbXNcbiAgICBpZihuZXdEb2N1bWVudCkge1xuICAgICAgT2JqZWN0LmFzc2lnbihkb2N1bWVudCwgbmV3RG9jdW1lbnQpO1xuICAgIH1cblxuICAgIC8vIGZsaXAgZmxvcCBpZHMgYmFja1xuICAgIG5ld0RvY3VtZW50LmlkID0gaWQudG9TdHJpbmcoKTtcbiAgICBkZWxldGUgbmV3RG9jdW1lbnQuX2lkO1xuXG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJ10sIG5ld0RvY3VtZW50KTtcbiAgICByZXR1cm4gbmV3RG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBmaW5kT25lQnlJZEFuZFVwZGF0ZShpZDogc3RyaW5nLCByZXE6IFVwZGF0ZUJ5SWRSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZUFuZFVwZGF0ZSh7XG4gICAgICBjb25kaXRpb25zOiB7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9LFxuICAgICAgdXBkYXRlczogcmVxLnVwZGF0ZXMsXG4gICAgICB1cHNlcnQ6IHJlcS51cHNlcnRcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmVBbmRVcGRhdGUocmVxOiBVcGRhdGVSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIHJlcS51cGRhdGVzKTtcbiAgICBcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uXG4gICAgICAuZmluZE9uZUFuZFVwZGF0ZShyZXEuY29uZGl0aW9ucywgdXBkYXRlcywgeyB1cHNlcnQ6IHJlcS51cHNlcnQgfSk7XG5cbiAgICBsZXQgZG9jdW1lbnQgPSByZXMudmFsdWU7XG4gICAgZG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKGRvY3VtZW50LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQgPSB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIGRvY3VtZW50KTtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBkZWxldGVPbmVCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmRlbGV0ZU9uZSh7XG4gICAgICBfaWQ6IG5ldyBPYmplY3RJRChpZClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlT25lKGNvbmRpdGlvbnMpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlTWFueShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBhd2FpdCB0aGlzLmNvbGxlY3Rpb247XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZGVsZXRlTWFueShjb25kaXRpb25zKTtcbiAgfVxuXG59XG5cbiJdfQ==