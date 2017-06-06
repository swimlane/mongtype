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
let Database = class Database {
    get connection() {
        if (!this.db) {
            try {
                this.db = mongodb_1.MongoClient.connect(this.uri);
                console.log(`Mongo: Connection opened: ${this.uri}`);
            }
            catch (e) {
                console.error('Mongo: Connection error', e);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQUFxRjtBQUNyRiwrQ0FBMEM7QUFHMUMsSUFBYSxRQUFRLEdBQXJCO0lBS0UsSUFBSSxVQUFVO1FBQ1osRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksQ0FBQztnQkFDSCxJQUFJLENBQUMsRUFBRSxHQUFHLHFCQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUFDLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFSyxPQUFPLENBQUMsR0FBRzs7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtDQUVGLENBQUE7QUF2QlksUUFBUTtJQURwQix5QkFBVSxFQUFFO0dBQ0EsUUFBUSxDQXVCcEI7QUF2QlksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVcGRhdGVXcml0ZU9wUmVzdWx0LCBPYmplY3RJRCwgTW9uZ29DbGllbnQsIERiLCBDb2xsZWN0aW9uIH0gZnJvbSAnbW9uZ29kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIHtcblxuICBwcml2YXRlIGRiOiBQcm9taXNlPERiPjtcbiAgcHJpdmF0ZSB1cmk6IHN0cmluZztcbiAgXG4gIGdldCBjb25uZWN0aW9uKCk6IFByb21pc2U8RGI+IHtcbiAgICBpZiAoIXRoaXMuZGIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZGIgPSBNb25nb0NsaWVudC5jb25uZWN0KHRoaXMudXJpKTtcbiAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNb25nbzogQ29ubmVjdGlvbiBlcnJvcicsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRiO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdCh1cmkpOiBQcm9taXNlPERiPiB7XG4gICAgdGhpcy51cmkgPSB1cmk7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbjtcbiAgfVxuXG59XG4iXX0=