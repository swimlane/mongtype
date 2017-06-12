"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
const mongodb_1 = require("mongodb");
const injection_js_1 = require("injection-js");
const retry = require("retry");
let Database = class Database {
    get connection() {
        if (!this.db) {
            const operation = retry.operation();
            operation.attempt((attempt) => {
                this.db = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const db = yield mongodb_1.MongoClient.connect(this.uri);
                        console.log(`Mongo: Connection opened: ${this.uri}`);
                        resolve(db);
                    }
                    catch (e) {
                        if (operation.retry(e))
                            return;
                        console.error('Mongo: Connection error', e);
                        reject(e);
                    }
                }));
            });
        }
        return this.db;
    }
    connect(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.uri = uri;
            return this.connection;
        });
    }
};
Database = __decorate([
    injection_js_1.Injectable()
], Database);
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQUFxRjtBQUNyRiwrQ0FBMEM7QUFDMUMsK0JBQStCO0FBRy9CLElBQWEsUUFBUSxHQUFyQjtJQUtFLElBQUksVUFBVTtRQUNaLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDYixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFcEMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU87Z0JBQ3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBTyxPQUFPLEVBQUUsTUFBTTtvQkFDMUMsSUFBSSxDQUFDO3dCQUNILE1BQU0sRUFBRSxHQUFHLE1BQU0scUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQzt3QkFDckQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNkLENBQUM7b0JBQUMsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDVixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQzt3QkFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDNUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNaLENBQUM7Z0JBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFSyxPQUFPLENBQUMsR0FBRzs7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtDQUVGLENBQUE7QUFoQ1ksUUFBUTtJQURwQix5QkFBVSxFQUFFO0dBQ0EsUUFBUSxDQWdDcEI7QUFoQ1ksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVcGRhdGVXcml0ZU9wUmVzdWx0LCBPYmplY3RJRCwgTW9uZ29DbGllbnQsIERiLCBDb2xsZWN0aW9uIH0gZnJvbSAnbW9uZ29kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcbmltcG9ydCAqIGFzIHJldHJ5IGZyb20gJ3JldHJ5JztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIHtcblxuICBwcml2YXRlIGRiOiBQcm9taXNlPERiPjtcbiAgcHJpdmF0ZSB1cmk6IHN0cmluZztcbiAgXG4gIGdldCBjb25uZWN0aW9uKCk6IFByb21pc2U8RGI+IHtcbiAgICBpZiAoIXRoaXMuZGIpIHtcbiAgICAgIGNvbnN0IG9wZXJhdGlvbiA9IHJldHJ5Lm9wZXJhdGlvbigpO1xuXG4gICAgICBvcGVyYXRpb24uYXR0ZW1wdCgoYXR0ZW1wdCkgPT4ge1xuICAgICAgICB0aGlzLmRiID0gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYiA9IGF3YWl0IE1vbmdvQ2xpZW50LmNvbm5lY3QodGhpcy51cmkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgICAgICAgIHJlc29sdmUoZGIpO1xuICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgaWYgKG9wZXJhdGlvbi5yZXRyeShlKSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTW9uZ286IENvbm5lY3Rpb24gZXJyb3InLCBlKTtcbiAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGI7XG4gIH1cblxuICBhc3luYyBjb25uZWN0KHVyaSk6IFByb21pc2U8RGI+IHtcbiAgICB0aGlzLnVyaSA9IHVyaTtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uO1xuICB9XG5cbn1cbiJdfQ==