import { mapFieldsToModel } from "./lib/utils";
import { Message } from "../models";

export const resolvers = {
  Message: {
    ...mapFieldsToModel(
      [
        "id",
        "text",
        "userNumber",
        "contactNumber",
        "createdAt",
        "isFromContact",
        "attachments"
      ],
      Message
    ),
    campaignId: instance => instance["campaign_id"]
  }
};
