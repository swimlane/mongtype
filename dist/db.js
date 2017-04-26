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
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], Database);
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXFGO0FBQ3JGLCtDQUEwQztBQUcxQyxJQUFhLFFBQVEsR0FBckI7SUFLRSxJQUFJLFVBQVU7UUFDWixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxDQUFDO2dCQUNILElBQUksQ0FBQyxFQUFFLEdBQUcscUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN2RCxDQUFFO1lBQUEsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVLLE9BQU8sQ0FBQyxHQUFHOztZQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0NBRUYsQ0FBQTtBQXZCWSxRQUFRO0lBRHBCLHlCQUFVLEVBQUU7O0dBQ0EsUUFBUSxDQXVCcEI7QUF2QlksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVcGRhdGVXcml0ZU9wUmVzdWx0LCBPYmplY3RJRCwgTW9uZ29DbGllbnQsIERiLCBDb2xsZWN0aW9uIH0gZnJvbSAnbW9uZ29kYic7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnaW5qZWN0aW9uLWpzJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIHtcblxuICBwcml2YXRlIGRiOiBQcm9taXNlPERiPjtcbiAgcHJpdmF0ZSB1cmk6IHN0cmluZztcbiAgXG4gIGdldCBjb25uZWN0aW9uKCk6IFByb21pc2U8RGI+IHtcbiAgICBpZiAoIXRoaXMuZGIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZGIgPSBNb25nb0NsaWVudC5jb25uZWN0KHRoaXMudXJpKTtcbiAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNb25nbzogQ29ubmVjdGlvbiBlcnJvcicsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRiO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdCh1cmkpOiBQcm9taXNlPERiPiB7XG4gICAgdGhpcy51cmkgPSB1cmk7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbjtcbiAgfVxuXG59XG4iXX0=