import preconditions from "src/server/preconditions";
import { UserInputError } from "src/server/api/errors";
import {
  Table,
  getAny,
  insertAndReturn,
  genericGetMany,
  genericList
} from "./common";

const SLUG_REGEX = /^[a-z0-9_]+$/;

async function create(
  { organizationId, group, displayValue, slug, createdBy },
  opts
) {
  preconditions.checkMany({ organizationId, displayValue, slug });
  if (!SLUG_REGEX.test(slug)) {
    // TODO: maybe create a db.ValidationError and map it to UserInput error in resolvers?
    throw new UserInputError(`slug does not match regex: ${SLUG_REGEX}`);
  }
  return insertAndReturn(
    Table.LABEL,
    { organizationId, group, displayValue, slug, createdBy },
    opts
  );
}

async function get(id, opts) {
  return getAny(Table.LABEL, "id", id, opts);
}

async function getMany(ids, opts) {
  return genericGetMany(Table.LABEL, "id", ids, opts);
}

async function listForOrganization(organizationId, opts) {
  return genericList(Table.LABEL, { organization_id: organizationId }, opts);
}

export default {
  create,
  get,
  getMany,
  listForOrganization
};
