import db from "src/server/db";
import { mapFieldsToModel } from "./lib/utils";
import { CannedResponse } from "../models";

export const resolvers = {
  CannedResponse: {
    ...mapFieldsToModel(
      ["id", "title", "text", "surveyQuestion", "deleted"],
      CannedResponse
    ),
    isUserCreated: cannedResponse => cannedResponse.user_id !== "",
    labels: async cannedResponse =>
      db.CannedResponse.listLabels(cannedResponse.id)
  }
};
