"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = isAdmin;
exports.isSeller = isSeller;
const roles_1 = require("../config/roles");
function isAdmin(member) {
    return (member.roles.cache.has(roles_1.ROLES.admin) ||
        member.permissions.has("Administrator"));
}
function isSeller(member) {
    return member.roles.cache.has(roles_1.ROLES.seller) || isAdmin(member);
}
//# sourceMappingURL=permissions.js.map