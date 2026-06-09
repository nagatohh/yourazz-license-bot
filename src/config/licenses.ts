import { env } from "./bot";

export interface PlanConfig {
  name: string;
  displayName: string;
  emoji: string;
  price: number;
  currency: string;
  durationDays: number;
  maxProducts: number;
  roleId: string;
  features: string[];
  color: number;
}

export const PLANS: Record<string, PlanConfig> = {
  vendeur: {
    name: "vendeur",
    displayName: "Vendeur",
    emoji: "🏷️",
    price: 2500,
    currency: "EUR",
    durationDays: 30,
    maxProducts: -1,
    roleId: env.SELLER_BASIC_ROLE_ID,
    features: [
      "Accès vendeur complet",
      "Produits illimités",
      "Licence 30 jours",
      "Support prioritaire",
    ],
    color: 0xdc2626,
  },
};

export const REMINDER_DAYS = [7, 3, 1];
