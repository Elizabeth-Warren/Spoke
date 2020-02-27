import { accessRequired } from "src/server/api/errors";

export const resolvers = {
  Label: {
    createdBy: async ({ organizationId, createdBy }, _, { loaders, user }) => {
      await accessRequired(user, organizationId, "ADMIN");
      return loaders.user.load(createdBy);
    }
  }
};
