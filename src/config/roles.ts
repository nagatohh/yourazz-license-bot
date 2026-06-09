import { env } from "./bot";

export const ROLES = {
  admin: env.ADMIN_ROLE_ID,
  seller: env.SELLER_BASIC_ROLE_ID,
};

export const ALL_SELLER_ROLES = [
  ROLES.seller,
];
