import userCache from "src/server/models/cacheable_queries/user";
import { Table, getAny, queryBuilder } from "./common";

async function getByEmail(email, opts) {
  return getAny(Table.USER, "email", email, opts);
}

async function isMemberOfOrganization(userId, organizationId, opts) {
  const res = await queryBuilder(Table.USER_ORGANIZATION, opts)
    .select("id")
    .where({ user_id: userId, organization_id: organizationId })
    .first();

  return !!res;
}

async function addToOrganization({ userId, organizationId, role }, opts) {
  const added = await queryBuilder(Table.USER_ORGANIZATION, opts).insert({
    user_id: userId,
    organization_id: organizationId,
    role
  });
  await userCache.clearUser(userId);
  return added;
}

export default {
  getByEmail,
  isMemberOfOrganization,
  addToOrganization
};
