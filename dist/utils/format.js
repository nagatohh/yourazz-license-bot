"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrice = formatPrice;
exports.formatDate = formatDate;
exports.daysUntil = daysUntil;
exports.generateLicenseKey = generateLicenseKey;
function formatPrice(cents, currency = "EUR") {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
    }).format(cents / 100);
}
function formatDate(date) {
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(date);
}
function daysUntil(date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function generateLicenseKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `YRZ-${segment()}-${segment()}-${segment()}`;
}
//# sourceMappingURL=format.js.map