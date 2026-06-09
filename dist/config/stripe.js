"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const bot_1 = require("./bot");
exports.stripe = bot_1.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(bot_1.env.STRIPE_SECRET_KEY)
    : null;
//# sourceMappingURL=stripe.js.map