import thinky from "./thinky";
const type = thinky.type;
import { requiredString } from "./custom-types";

import User from "./user";
import Organization from "./organization";

const UserOrganization = thinky.createModel(
  "user_organization",
  type
    .object()
    .schema({
      id: type.string(),
      user_id: requiredString(),
      organization_id: requiredString(),
      role: requiredString().enum(
        "OWNER",
        "ADMIN",
        "SUPERVOLUNTEER",
        "TEXTER",
        "SUSPENDED"
      )
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [User, Organization] }
);

export default UserOrganization;
