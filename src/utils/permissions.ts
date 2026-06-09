import { GuildMember } from "discord.js";
import { ROLES } from "../config/roles";

export function isAdmin(member: GuildMember): boolean {
  return (
    member.roles.cache.has(ROLES.admin) ||
    member.permissions.has("Administrator")
  );
}

export function isSeller(member: GuildMember): boolean {
  return member.roles.cache.has(ROLES.seller) || isAdmin(member);
}
