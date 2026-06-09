import Stripe from "stripe";
import { env } from "./bot";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);
