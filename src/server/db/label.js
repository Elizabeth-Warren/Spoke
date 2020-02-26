import {
  Table,
  getAny,
  insertAndReturn,
  genericGetMany,
  genericList
} from "./common";

async function create(
  { organizationId, group, displayValue, slug, createdBy },
  opts
) {
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
