import { getFormattedPhoneNumber } from "src/lib/phone-format";
import {
  queryBuilder,
  Table,
  knex,
  getAny,
  decamelize,
  withTransaction
} from "./common";
import preconditions from "src/server/preconditions";

const Status = {
  // Available to be claimed by a campaign
  AVAILABLE: "AVAILABLE",
  // Reserved by a campaign but not yet allocated to a messaging service
  RESERVED: "RESERVED",
  // Assigned to a campaign
  ASSIGNED: "ASSIGNED"
};

/**
 * Attempt to reserve exactly 'amount' phone numbers for 'areaCode'. If
 * fewer than 'amount' numbers are available in the inventory, the campaign's
 * previous phone number reservations remain unchanged.
 *
 * Note: If a transaction is provided, this function will roll it back if it
 * fails to find enough numbers. The caller will not be able to continue using
 * it.
 *
 * @return {Promise<boolean>} true if it successfully reserved enough numbers, false
 *   if it failed.
 */
async function reserveForCampaign({ campaignId, areaCode, amount }, opts = {}) {
  preconditions.checkMany({ campaignId, areaCode, amount });
  return withTransaction(opts.transaction, async trx => {
    const builderOpts = { ...opts, transaction: trx };

    const numbers = await queryBuilder(Table.TWILIO_PHONE_NUMBER, builderOpts)
      .select("sid")
      .forUpdate()
      .where({
        status: Status.AVAILABLE,
        area_code: areaCode,
        campaign_id: null
      })
      .limit(amount);

    if (numbers.length < amount) {
      throw Error(`Failed to reserve ${amount} numbers for ${areaCode}`);
    }

    const reserved = await queryBuilder(Table.TWILIO_PHONE_NUMBER, builderOpts)
      .whereIn(
        "sid",
        numbers.map(r => r.sid)
      )
      .update({
        campaign_id: campaignId,
        status: Status.RESERVED,
        reserved_at: knex.raw("now()")
      });

    // a good old this should never happen check
    if (reserved !== amount) {
      throw Error(`Number of reserved ${reserved} does not match ${amount}`);
    }

    return true;
  });
}

/**
 * Immediately make numbers available to other campaigns regardless of status.
 *
 * Does not perform any actions in Twilio. The campaign's Messaging Service
 * should be deleted before calling this function.
 */
async function releaseAllCampaignNumbers(campaignId, opts) {
  preconditions.check(campaignId, "campaignId is required");
  return queryBuilder(Table.TWILIO_PHONE_NUMBER, opts)
    .where("campaign_id", campaignId)
    .update({
      campaign_id: null,
      status: Status.AVAILABLE,
      reserved_at: null
    });
}

/**
 * Mark all of a campaign's reserved numbers as assigned.
 *
 * Does not perform any actions in Twilio.
 */
async function assignToCampaign(campaignId, opts) {
  preconditions.check(campaignId, "campaignId is required");
  return queryBuilder(Table.TWILIO_PHONE_NUMBER, opts)
    .where({
      campaign_id: campaignId,
      status: Status.RESERVED
    })
    .update({
      status: Status.ASSIGNED,
      reserved_at: null
    });
}

async function countByAreaCode(where, opts) {
  let builder = queryBuilder(Table.TWILIO_PHONE_NUMBER, opts)
    .select("area_code as areaCode")
    .groupBy("areaCode")
    .count("*");
  if (where) {
    builder = builder.where(decamelize(where));
  }
  // convert count results to numbers, see: https://github.com/knex/knex/issues/387
  return (await builder).map(r => ({
    areaCode: r.areaCode,
    count: parseInt(r.count, 10)
  }));
}

async function get(sid, opts) {
  return getAny(Table.TWILIO_PHONE_NUMBER, "sid", sid, opts);
}

async function listCampaignNumbers(campaignId, status, opts) {
  return queryBuilder(Table.TWILIO_PHONE_NUMBER, opts).where({
    campaign_id: campaignId,
    status
  });
}

async function create({ sid, phoneNumber, status = Status.AVAILABLE }, opts) {
  const formatted = getFormattedPhoneNumber(phoneNumber);
  // Warning: makes no attempt to work for non-US numbers
  const areaCode = formatted.slice(2, 5);
  preconditions.check(formatted && areaCode, "Invalid phone number");

  return await queryBuilder(Table.TWILIO_PHONE_NUMBER, opts).insert({
    area_code: areaCode,
    phone_number: formatted,
    status,
    sid
  });
}

export default {
  Status,
  create,
  get,
  countByAreaCode,
  releaseAllCampaignNumbers,
  reserveForCampaign,
  assignToCampaign,
  listCampaignNumbers
};
