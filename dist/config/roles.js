"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_SELLER_ROLES = exports.ROLES = void 0;
const bot_1 = require("./bot");
exports.ROLES = {
    admin: bot_1.env.ADMIN_ROLE_ID,
    seller: bot_1.env.SELLER_BASIC_ROLE_ID,
};
exports.ALL_SELLER_ROLES = [
    exports.ROLES.seller,
];
//# sourceMappingURL=roles.js.map