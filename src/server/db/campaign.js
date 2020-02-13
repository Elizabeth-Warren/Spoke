import { Table, getAny } from "./common";
import preconditions from "src/server/preconditions";

async function getByJoinToken(token, opts) {
  preconditions.check(token, "'token' must be provided");
  return getAny(Table.CAMPAIGN, "join_token", token, opts);
}

export default {
  getByJoinToken
};
