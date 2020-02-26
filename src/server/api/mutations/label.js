import db from "src/server/db";

export const mutations = {
  createLabel: async (_, { label }, { user }) => {
    return db.Label.create({ ...label, createdBy: user.id });
  }
};
