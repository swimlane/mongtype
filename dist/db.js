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
const mongodb_1 = require("mongodb");
const injection_js_1 = require("injection-js");
const retry = require("retry");
const events_1 = require("events");
const util_1 = require("./util");
let Database = class Database extends events_1.EventEmitter {
    constructor() {
        super();
        this.connection = util_1.defer();
    }
    connect(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.uri = uri;
            this.createConnection();
            return this.connection;
        });
    }
    createConnection() {
        const operation = retry.operation();
        operation.attempt((attempt) => __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield mongodb_1.MongoClient.connect(this.uri);
                console.log(`Mongo: Connection opened: ${this.uri}`);
                this.emit('connected', db);
                this.connection.resolve(db);
            }
            catch (e) {
                if (operation.retry(e))
                    return;
                console.error('Mongo: Connection error', e);
                this.emit('error', e);
                this.connection.reject(e);
            }
        }));
    }
};
Database = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], Database);
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQUFxRjtBQUNyRiwrQ0FBMEM7QUFDMUMsK0JBQStCO0FBQy9CLG1DQUFzQztBQUN0QyxpQ0FBK0I7QUFHL0IsSUFBYSxRQUFRLEdBQXJCLGNBQXNCLFNBQVEscUJBQVk7SUFLeEM7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBSyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVLLE9BQU8sQ0FBQyxHQUFHOztZQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQ2YsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRU8sZ0JBQWdCO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNwQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQU8sT0FBTztZQUM5QixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxFQUFFLEdBQUcsTUFBTSxxQkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUFDLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxNQUFNLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRixDQUFBO0FBakNZLFFBQVE7SUFEcEIseUJBQVUsRUFBRTs7R0FDQSxRQUFRLENBaUNwQjtBQWpDWSw0QkFBUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFVwZGF0ZVdyaXRlT3BSZXN1bHQsIE9iamVjdElELCBNb25nb0NsaWVudCwgRGIsIENvbGxlY3Rpb24gfSBmcm9tICdtb25nb2RiJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdpbmplY3Rpb24tanMnO1xuaW1wb3J0ICogYXMgcmV0cnkgZnJvbSAncmV0cnknO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGRlZmVyIH0gZnJvbSAnLi91dGlsJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25uZWN0aW9uOiBhbnk7XG4gIHByaXZhdGUgdXJpOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBkZWZlcigpO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdCh1cmkpOiBQcm9taXNlPERiPiB7XG4gICAgdGhpcy51cmkgPSB1cmk7XG4gICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29ubmVjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBvcGVyYXRpb24gPSByZXRyeS5vcGVyYXRpb24oKTtcbiAgICBvcGVyYXRpb24uYXR0ZW1wdChhc3luYyAoYXR0ZW1wdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGIgPSBhd2FpdCBNb25nb0NsaWVudC5jb25uZWN0KHRoaXMudXJpKTtcbiAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0ZWQnLCBkYik7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5yZXNvbHZlKGRiKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBpZiAob3BlcmF0aW9uLnJldHJ5KGUpKSByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01vbmdvOiBDb25uZWN0aW9uIGVycm9yJywgZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlKTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnJlamVjdChlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG4iXX0=