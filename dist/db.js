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
const events_1 = require("events");
let Database = class Database extends events_1.EventEmitter {
    connect(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this.uri = uri;
            this.connection = this.createConnection();
            return this.connection;
        });
    }
    createConnection() {
        const operation = retry.operation();
        return new Promise((resolve, reject) => {
            operation.attempt((attempt) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const db = yield mongodb_1.MongoClient.connect(this.uri);
                    console.log(`Mongo: Connection opened: ${this.uri}`);
                    this.emit('connected', db);
                    resolve(db);
                }
                catch (e) {
                    if (operation.retry(e))
                        return;
                    console.error('Mongo: Connection error', e);
                    this.emit('error', e);
                    reject(e);
                }
            }));
        });
    }
};
Database = __decorate([
    injection_js_1.Injectable()
], Database);
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQUFxRjtBQUNyRiwrQ0FBMEM7QUFDMUMsK0JBQStCO0FBQy9CLG1DQUFzQztBQUd0QyxJQUFhLFFBQVEsR0FBckIsY0FBc0IsU0FBUSxxQkFBWTtJQUtsQyxPQUFPLENBQUMsR0FBRzs7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRU8sZ0JBQWdCO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVwQyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTTtZQUNqQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQU8sT0FBTztnQkFDOUIsSUFBSSxDQUFDO29CQUNILE1BQU0sRUFBRSxHQUFHLE1BQU0scUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzNCLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDZCxDQUFDO2dCQUFDLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1YsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxNQUFNLENBQUM7b0JBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN0QixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osQ0FBQztZQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRixDQUFBO0FBL0JZLFFBQVE7SUFEcEIseUJBQVUsRUFBRTtHQUNBLFFBQVEsQ0ErQnBCO0FBL0JZLDRCQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ2luamVjdGlvbi1qcyc7XG5pbXBvcnQgKiBhcyByZXRyeSBmcm9tICdyZXRyeSc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGF0YWJhc2UgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gIGNvbm5lY3Rpb246IFByb21pc2U8RGI+O1xuICBwcml2YXRlIHVyaTogc3RyaW5nO1xuXG4gIGFzeW5jIGNvbm5lY3QodXJpKTogUHJvbWlzZTxEYj4ge1xuICAgIHRoaXMudXJpID0gdXJpO1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IHRoaXMuY3JlYXRlQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb247XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbm5lY3Rpb24oKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBvcGVyYXRpb24gPSByZXRyeS5vcGVyYXRpb24oKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBvcGVyYXRpb24uYXR0ZW1wdChhc3luYyAoYXR0ZW1wdCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGRiID0gYXdhaXQgTW9uZ29DbGllbnQuY29ubmVjdCh0aGlzLnVyaSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RlZCcsIGRiKTtcbiAgICAgICAgICByZXNvbHZlKGRiKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgaWYgKG9wZXJhdGlvbi5yZXRyeShlKSkgcmV0dXJuO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01vbmdvOiBDb25uZWN0aW9uIGVycm9yJywgZSk7XG4gICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGUpO1xuICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxufVxuIl19