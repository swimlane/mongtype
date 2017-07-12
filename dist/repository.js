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
            this.db.once('connected', (db) => __awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIscUNBQXFGO0FBQ3JGLG1DQUVpQjtBQUNqQiw2QkFBZ0M7QUFDaEMsK0NBQTBDO0FBRzFDLElBQWEsZUFBZSxHQUE1QjtJQVlFLFlBQW1CLEVBQVk7UUFBWixPQUFFLEdBQUYsRUFBRSxDQUFVO1FBQzdCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFWRCxJQUFJLFVBQVU7UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksT0FBTztRQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLHNCQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQU1ELFFBQVEsQ0FBQyxFQUFVO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksa0JBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVLLE9BQU8sQ0FBQyxVQUFlOztZQUMzQixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDekMsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsRUFBRSxDQUFBLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLFFBQVEs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QUFDO2dCQUN0QyxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDdEIsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFYSxZQUFZLENBQUMsSUFBWSxFQUFFLEdBQWEsRUFBRSxRQUFhOztZQUNuRSxHQUFHLENBQUEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEUsR0FBRyxDQUFBLENBQUMsTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDMUIsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3RDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxRQUFRLEdBQUcsTUFBTSxRQUFRLENBQUM7b0JBQzVCLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7WUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2xCLENBQUM7S0FBQTtDQUVGLENBQUE7QUFoTFksZUFBZTtJQUQzQix5QkFBVSxFQUFFO3FDQWFZLGFBQVE7R0FacEIsZUFBZSxDQWdMM0I7QUFoTFksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0IHsgXG4gIENPTExFQ1RJT05fS0VZLCBQUkVfS0VZLCBQT1NUX0tFWSwgQ29sbGVjdGlvblByb3BzLCBVcGRhdGVSZXF1ZXN0LCBVcGRhdGVCeUlkUmVxdWVzdCwgRmluZFJlcXVlc3QgXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICcuL2RiJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdpbmplY3Rpb24tanMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTW9uZ29SZXBvc2l0b3J5PFQ+IHtcblxuICBjb2xsZWN0aW9uOiBQcm9taXNlPENvbGxlY3Rpb24+O1xuICBcbiAgZ2V0IGNvbm5lY3Rpb24oKTogUHJvbWlzZTxEYj4ge1xuICAgIHJldHVybiB0aGlzLmRiLmNvbm5lY3Rpb247XG4gIH1cblxuICBnZXQgb3B0aW9ucygpOiBDb2xsZWN0aW9uUHJvcHMge1xuICAgIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKENPTExFQ1RJT05fS0VZLCB0aGlzKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBkYjogRGF0YWJhc2UpIHtcbiAgICB0aGlzLmNyZWF0ZUNvbGxlY3Rpb24oKTtcbiAgfVxuXG4gIGZpbmRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5maW5kT25lKHsgX2lkOiBuZXcgT2JqZWN0SUQoaWQpIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZE9uZShjb25kaXRpb25zOiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIGNvbnN0IGN1cnNvciA9IGNvbGxlY3Rpb24uZmluZChjb25kaXRpb25zKS5saW1pdCgxKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGN1cnNvci50b0FycmF5KCk7XG4gICAgaWYocmVzICYmIHJlcy5sZW5ndGgpIHtcbiAgICAgIGxldCBkb2N1bWVudCA9IHJlc1swXTtcbiAgICAgIGRvY3VtZW50ID0gdGhpcy50b2dnbGVJZChkb2N1bWVudCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydmaW5kJywgJ2ZpbmRPbmUnXSwgZG9jdW1lbnQpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZpbmQocmVxOiBGaW5kUmVxdWVzdCA9IHsgY29uZGl0aW9uczoge30gfSk6IFByb21pc2U8YW55W1RdPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBcbiAgICBjb25zdCBjb25kaXRpb25zICA9IHRoaXMudG9nZ2xlSWQocmVxLmNvbmRpdGlvbnMsIHRydWUpO1xuICAgIGxldCBjdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoY29uZGl0aW9ucyk7XG5cbiAgICBpZiAocmVxLnByb2plY3Rpb24pIHtcbiAgICAgIGN1cnNvciA9IGN1cnNvci5wcm9qZWN0KHJlcS5wcm9qZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocmVxLnNvcnQpIHtcbiAgICAgIGN1cnNvciA9IGN1cnNvci5zb3J0KHJlcS5zb3J0KTtcbiAgICB9XG5cbiAgICBpZiAocmVxLmxpbWl0KSB7XG4gICAgICBjdXJzb3IgPSBjdXJzb3IubGltaXQocmVxLmxpbWl0KTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdEb2N1bWVudHMgPSBhd2FpdCBjdXJzb3IudG9BcnJheSgpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcblxuICAgIGZvcihsZXQgZG9jdW1lbnQgb2YgbmV3RG9jdW1lbnRzKSB7XG4gICAgICBkb2N1bWVudCA9IHRoaXMudG9nZ2xlSWQoZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsnZmluZCcsICdmaW5kTWFueSddLCBkb2N1bWVudCk7XG4gICAgICByZXN1bHRzLnB1c2goZG9jdW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGRvY3VtZW50OiBUKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBkb2N1bWVudCA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZScsICdjcmVhdGUnXSwgZG9jdW1lbnQpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbGxlY3Rpb24uaW5zZXJ0T25lKGRvY3VtZW50KTtcblxuICAgIGxldCBuZXdEb2N1bWVudCA9IHJlcy5vcHNbMF07XG4gICAgbmV3RG9jdW1lbnQgPSB0aGlzLnRvZ2dsZUlkKG5ld0RvY3VtZW50LCBmYWxzZSk7XG4gICAgbmV3RG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJywgJ2NyZWF0ZSddLCBuZXdEb2N1bWVudCk7XG4gICAgcmV0dXJuIG5ld0RvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgc2F2ZShkb2N1bWVudDogYW55KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBcbiAgICAvLyBmbGlwL2Zsb3AgaWRzXG4gICAgY29uc3QgaWQgPSBuZXcgT2JqZWN0SUQoZG9jdW1lbnQuaWQpO1xuICAgIGRlbGV0ZSBkb2N1bWVudC5pZDtcbiAgICBkZWxldGUgZG9jdW1lbnQuX2lkO1xuXG4gICAgY29uc3QgdXBkYXRlcyA9IGF3YWl0IHRoaXMuaW52b2tlRXZlbnRzKFBSRV9LRVksIFsnc2F2ZSddLCBkb2N1bWVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29sbGVjdGlvbi51cGRhdGVPbmUoeyBfaWQ6IGlkIH0sIHsgJHNldDogdXBkYXRlcyB9LCB7IHVwc2VydDogdHJ1ZSB9KTtcbiAgICBsZXQgbmV3RG9jdW1lbnQgPSBhd2FpdCBjb2xsZWN0aW9uLmZpbmRPbmUoeyBfaWQ6IGlkIH0pO1xuXG4gICAgLy8gcHJvamVjdCBuZXcgaXRlbXNcbiAgICBpZihuZXdEb2N1bWVudCkge1xuICAgICAgT2JqZWN0LmFzc2lnbihkb2N1bWVudCwgbmV3RG9jdW1lbnQpO1xuICAgIH1cblxuICAgIC8vIGZsaXAgZmxvcCBpZHMgYmFja1xuICAgIG5ld0RvY3VtZW50LmlkID0gaWQudG9TdHJpbmcoKTtcbiAgICBkZWxldGUgbmV3RG9jdW1lbnQuX2lkO1xuXG4gICAgbmV3RG9jdW1lbnQgPSBhd2FpdCB0aGlzLmludm9rZUV2ZW50cyhQT1NUX0tFWSwgWydzYXZlJ10sIG5ld0RvY3VtZW50KTtcbiAgICByZXR1cm4gbmV3RG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBmaW5kT25lQnlJZEFuZFVwZGF0ZShpZDogc3RyaW5nLCByZXE6IFVwZGF0ZUJ5SWRSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZUFuZFVwZGF0ZSh7XG4gICAgICBjb25kaXRpb25zOiB7IF9pZDogbmV3IE9iamVjdElEKGlkKSB9LFxuICAgICAgdXBkYXRlczogcmVxLnVwZGF0ZXMsXG4gICAgICB1cHNlcnQ6IHJlcS51cHNlcnRcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRPbmVBbmRVcGRhdGUocmVxOiBVcGRhdGVSZXF1ZXN0KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuY29sbGVjdGlvbjtcbiAgICBjb25zdCB1cGRhdGVzID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUFJFX0tFWSwgWyd1cGRhdGUnLCAndXBkYXRlT25lJ10sIHJlcS51cGRhdGVzKTtcbiAgICBcbiAgICBjb25zdCByZXMgPSBhd2FpdCBjb2xsZWN0aW9uXG4gICAgICAuZmluZE9uZUFuZFVwZGF0ZShyZXEuY29uZGl0aW9ucywgdXBkYXRlcywgeyB1cHNlcnQ6IHJlcS51cHNlcnQsIHJldHVybk5ld0RvY3VtZW50OiB0cnVlIH0pO1xuXG4gICAgbGV0IGRvY3VtZW50ID0gcmVzLnZhbHVlO1xuICAgIGRvY3VtZW50ID0gdGhpcy50b2dnbGVJZChkb2N1bWVudCwgZmFsc2UpO1xuICAgIGRvY3VtZW50ID0gYXdhaXQgdGhpcy5pbnZva2VFdmVudHMoUE9TVF9LRVksIFsndXBkYXRlJywgJ3VwZGF0ZU9uZSddLCBkb2N1bWVudCk7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlT25lQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5kZWxldGVPbmUoe1xuICAgICAgX2lkOiBuZXcgT2JqZWN0SUQoaWQpXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBkZWxldGVPbmUoY29uZGl0aW9uczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmRlbGV0ZU9uZShjb25kaXRpb25zKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU1hbnkoY29uZGl0aW9uczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gYXdhaXQgdGhpcy5jb2xsZWN0aW9uO1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmRlbGV0ZU1hbnkoY29uZGl0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbGxlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5jb2xsZWN0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5kYi5vbmNlKCdjb25uZWN0ZWQnLCBhc3luYyAoZGIpID0+IHtcbiAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGRiLmNvbGxlY3Rpb24odGhpcy5vcHRpb25zLm5hbWUsIHtcbiAgICAgICAgICBzaXplOiB0aGlzLm9wdGlvbnMuc2l6ZSxcbiAgICAgICAgICBjYXBwZWQ6IHRoaXMub3B0aW9ucy5jYXBwZWQsXG4gICAgICAgICAgbWF4OiB0aGlzLm9wdGlvbnMubWF4XG4gICAgICAgIH0pO1xuICAgICAgICByZXNvbHZlKGNvbGxlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUlkKGRvY3VtZW50OiBhbnksIHJlcGxhY2U6IGJvb2xlYW4pOiBUIHtcbiAgICBpZihkb2N1bWVudCAmJiAoZG9jdW1lbnQuaWQgfHwgZG9jdW1lbnQuX2lkKSkge1xuICAgICAgaWYocmVwbGFjZSkge1xuICAgICAgICBkb2N1bWVudC5faWQgPSBuZXcgT2JqZWN0SUQoZG9jdW1lbnQuaWQpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5pZCA9IGRvY3VtZW50Ll9pZC50b1N0cmluZygpO1xuICAgICAgICBkZWxldGUgZG9jdW1lbnQuX2lkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGludm9rZUV2ZW50cyh0eXBlOiBzdHJpbmcsIGZuczogc3RyaW5nW10sIGRvY3VtZW50OiBhbnkpOiBQcm9taXNlPFQ+IHtcbiAgICBmb3IoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgICBjb25zdCBldmVudHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGAke3R5cGV9XyR7Zm59YCwgdGhpcykgfHwgW107XG4gICAgICBmb3IoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICAgIGRvY3VtZW50ID0gZXZlbnQuYmluZCh0aGlzKShkb2N1bWVudCk7XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGRvY3VtZW50ID0gYXdhaXQgZG9jdW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbn1cbiJdfQ==