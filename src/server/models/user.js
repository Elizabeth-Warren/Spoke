import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp } from "./custom-types";

const User = thinky.createModel(
  "user",
  type
    .object()
    .schema({
      id: type.string(),
      // LEGACY name, but contains the auth0_id OR the auth secret/token
      auth0_id: requiredString().stopReference(),
      first_name: requiredString(),
      last_name: requiredString(),
      cell: requiredString(),
      email: requiredString(),
      created_at: timestamp(),
      assigned_cell: type.string(),
      is_superadmin: type.boolean(),
      terms: type.boolean().default(false)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

User.ensureIndex("email");

// Note: this doesn't enforce uniqueness; the knex migration to
// add this index creates it with a unique constraint.
User.ensureIndex("auth0_id");

export default User;
