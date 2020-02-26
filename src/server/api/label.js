import { accessRequired } from "src/server/api/errors";

export const resolvers = {
  Label: {
    // TODO[matteo]: change createdBy to return the User but figure out access control first
    //   shouldn't be needed for V0
    // createdBy: async ({ organizationId, createdBy }, _, { loaders, user }) => {
    //   await accessRequired(user, organizationId, "ADMIN");
    //   return loaders.user.load(createdBy);
    // }
  }
};
