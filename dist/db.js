"use strict";
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
const retry = require("retry");
const events_1 = require("events");
const util_1 = require("./util");
class Database extends events_1.EventEmitter {
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
}
exports.Database = Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHFDQUFxRjtBQUNyRiwrQkFBK0I7QUFDL0IsbUNBQXNDO0FBQ3RDLGlDQUErQjtBQUUvQixjQUFzQixTQUFRLHFCQUFZO0lBS3hDO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsVUFBVSxHQUFHLFlBQUssRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFSyxPQUFPLENBQUMsR0FBRzs7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVPLGdCQUFnQjtRQUN0QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFPLE9BQU87WUFDOUIsSUFBSSxDQUFDO2dCQUNILE1BQU0sRUFBRSxHQUFHLE1BQU0scUJBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFBQyxLQUFLLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNWLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDO0NBRUY7QUFqQ0QsNEJBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXBkYXRlV3JpdGVPcFJlc3VsdCwgT2JqZWN0SUQsIE1vbmdvQ2xpZW50LCBEYiwgQ29sbGVjdGlvbiB9IGZyb20gJ21vbmdvZGInO1xuaW1wb3J0ICogYXMgcmV0cnkgZnJvbSAncmV0cnknO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGRlZmVyIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25uZWN0aW9uOiBhbnk7XG4gIHByaXZhdGUgdXJpOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBkZWZlcigpO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdCh1cmkpOiBQcm9taXNlPERiPiB7XG4gICAgdGhpcy51cmkgPSB1cmk7XG4gICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29ubmVjdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBvcGVyYXRpb24gPSByZXRyeS5vcGVyYXRpb24oKTtcbiAgICBvcGVyYXRpb24uYXR0ZW1wdChhc3luYyAoYXR0ZW1wdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGIgPSBhd2FpdCBNb25nb0NsaWVudC5jb25uZWN0KHRoaXMudXJpKTtcbiAgICAgICAgY29uc29sZS5sb2coYE1vbmdvOiBDb25uZWN0aW9uIG9wZW5lZDogJHt0aGlzLnVyaX1gKTtcbiAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0ZWQnLCBkYik7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5yZXNvbHZlKGRiKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBpZiAob3BlcmF0aW9uLnJldHJ5KGUpKSByZXR1cm47XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01vbmdvOiBDb25uZWN0aW9uIGVycm9yJywgZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlKTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnJlamVjdChlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG4iXX0=