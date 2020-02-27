import GraphQLDate from "graphql-date";
import GraphQLJSON from "graphql-type-json";
import GraphQLDateTime from "graphql-type-datetime";
import { GraphQLError } from "graphql/error";
import isUrl from "is-url";
import { makeTree } from "src/lib";
import log from "src/server/log";
import {
  Assignment,
  Campaign,
  CannedResponse,
  InteractionStep,
  Message,
  Organization,
  QuestionResponse,
  UserOrganization,
  r
} from "src/server/models";
import { cacheableData } from "src/server/models/cacheable_queries";

import { campaignPhoneNumbersEnabled } from "./lib/utils";
import { resolvers as assignmentResolvers, getContacts } from "./assignment";
import { getCampaigns, resolvers as campaignResolvers } from "./campaign";
import { mutations as campaignMutations } from "./mutations/campaign";
import { mutations as labelMutations } from "./mutations/label";
import { resolvers as campaignContactResolvers } from "./campaign-contact";
import { resolvers as cannedResponseResolvers } from "./canned-response";
import {
  getConversations,
  getCampaignIdMessageIdsAndCampaignIdContactIdsMaps,
  reassignConversations,
  resolvers as conversationsResolver
} from "./conversations";
import {
  accessRequired,
  assignmentRequired,
  authRequired,
  superAdminRequired,
  requireAuthStrategy,
  ForbiddenError,
  UserInputError
} from "./errors";
import { resolvers as interactionStepResolvers } from "./interaction-step";
import { saveNewIncomingMessage } from "./lib/message-sending";
import serviceMap from "./lib/services";
import { resolvers as labelResolvers } from "./label";
import { resolvers as messageResolvers, messageDedupe } from "./message";
import { resolvers as optOutResolvers } from "./opt-out";
import { resolvers as organizationResolvers } from "./organization";
import { mutations as organizationMutations } from "./mutations/organization";
import { GraphQLPhone } from "./phone";
import { resolvers as questionResolvers } from "./question";
import { resolvers as questionResponseResolvers } from "./question-response";
import { getUsers, resolvers as userResolvers } from "./user";
import { change } from "../local-auth-helpers";
import { getSendBeforeTimeUtc } from "../../lib/timezones";

import { mutations as uploadContactMutations } from "./mutations/upload-contacts";

import { dispatchJob } from "../workers";

import request from "request";
import _, { flatten, get } from "lodash";
import humps from "humps";
import twilio from "./lib/twilio";
import db from "src/server/db";
import preconditions from "src/server/preconditions";
import BackgroundJob from "../db/background-job";
import config from "src/server/config";
import {
  ApolloError,
  CampaignArchivedError,
  NotFoundError
} from "src/server/api/errors";

const uuidv4 = require("uuid").v4;

// TODO[matteo]: move to ./mutations
async function updateCampaignPhoneNumbers(
  id,
  organization,
  campaignInput,
  origCampaignRecord
) {
  preconditions.check(
    !origCampaignRecord.isStarted,
    "Phone numbers can't be edited after a campaign has started"
  );
  preconditions.check(
    campaignPhoneNumbersEnabled(organization),
    "Campaign phone numbers feature not enabled"
  );
  const cfg = campaignInput.phoneNumbers;

  if (!cfg) {
    await db.TwilioPhoneNumber.releaseAllCampaignNumbers(id);
    return;
  }

  await db.transaction(async transaction => {
    await db.TwilioPhoneNumber.releaseAllCampaignNumbers(id, { transaction });
    for (let i = 0; i < cfg.length; i++) {
      const item = cfg[i];
      const success = await db.TwilioPhoneNumber.reserveForCampaign(
        {
          campaignId: id,
          amount: Math.min(
            item.count,
            twilio.MAX_NUMBERS_PER_MESSAGING_SERVICE
          ),
          areaCode: item.areaCode
        },
        { transaction }
      );

      if (!success) {
        throw Error("Failed to find sufficient phone numbers");
      }
    }
  });
}

async function editCampaign(id, campaign, loaders, user, origCampaignRecord) {
  log.debug({
    msg: "editCampaign mutation",
    campaign,
    origCampaignRecord,
    userId: user.id
  });
  const {
    title,
    description,
    dueBy,
    logoImageUrl,
    introHtml,
    primaryColor,
    overrideOrganizationTextingHours,
    textingHoursEnforced,
    textingHoursStart,
    textingHoursEnd,
    timezone,
    shiftingConfiguration
  } = campaign;
  // some changes require ADMIN and we recheck below
  const organizationId =
    campaign.organizationId || origCampaignRecord.organization_id;
  await accessRequired(
    user,
    organizationId,
    "SUPERVOLUNTEER",
    /* superadmin*/ true
  );
  const campaignUpdates = {
    id,
    title,
    description,
    due_by: dueBy,
    organization_id: organizationId,
    logo_image_url: isUrl(logoImageUrl) ? logoImageUrl : "",
    primary_color: primaryColor,
    intro_html: introHtml,
    override_organization_texting_hours: overrideOrganizationTextingHours,
    texting_hours_enforced: textingHoursEnforced,
    texting_hours_start: textingHoursStart,
    texting_hours_end: textingHoursEnd,
    timezone,
    shifting_configuration: shiftingConfiguration
  };

  Object.keys(campaignUpdates).forEach(key => {
    if (typeof campaignUpdates[key] === "undefined") {
      delete campaignUpdates[key];
    }
  });

  // Warren fork: removed contactSql option to load from data warehouse
  //   and removed texters section

  // We use _.has instead of hasOwnProperty because sometimes we're working with
  // a model returned via humps.decamelize(), and humps returns an object with no
  // prototype so hasOwnProperty may not exist.
  if (_.has(campaign, "interactionSteps")) {
    await accessRequired(
      user,
      organizationId,
      "SUPERVOLUNTEER",
      /* superadmin*/ true
    );
    await updateInteractionSteps(
      id,
      [campaign.interactionSteps],
      origCampaignRecord
    );
  }

  if (_.has(campaign, "phoneNumbers")) {
    await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);
    const organization = await Organization.get(organizationId);
    await updateCampaignPhoneNumbers(
      id,
      organization,
      campaign,
      origCampaignRecord
    );
  }

  if (_.has(campaign, "cannedResponses")) {
    const cannedResponses = campaign.cannedResponses;

    const newResponses = [];
    const updatedResponses = [];

    // Segment responses into new/updated and remove the isNew key. Also
    // add order and campaign_id and convert to snake_case for the DB.
    for (let index = 0; index < cannedResponses.length; index++) {
      const response = {
        ...cannedResponses[index],
        order: index,
        campaignId: id
      };

      const isNew = response.isNew;
      delete response.isNew;

      if (isNew) {
        response.id = undefined;
      }

      (isNew ? newResponses : updatedResponses).push(response);
    }

    await r.knex.transaction(async trx => {
      const cannedResponseLabels = [];

      for (const newResponse of newResponses) {
        const id = (
          await db.CannedResponse.create(newResponse, { transaction: trx })
        ).id;
        const labels = (newResponse.labelIds || []).map(lid => ({
          cannedResponseId: id,
          labelId: lid
        }));
        cannedResponseLabels.push(...labels);
      }
      if (cannedResponseLabels.length > 0) {
        await db.CannedResponse.bulkAddLabels(cannedResponseLabels, {
          transaction: trx
        });
      }
      // update existing rows
      for (const updatedResponse of updatedResponses) {
        if (!_.isEmpty(_.omit(updatedResponse, "labelIds"))) {
          await db.CannedResponse.update(updatedResponse.id, updatedResponse, {
            transaction: trx
          });
        }
        if (updatedResponse.labelIds) {
          await db.CannedResponse.updateLabels(
            updatedResponse.id,
            updatedResponse.labelIds
          );
        }
      }
    });

    await cacheableData.cannedResponse.clearQuery({
      userId: "",
      campaignId: id
    });
  }

  const newCampaign = await Campaign.get(id).update(campaignUpdates);
  await cacheableData.campaign.reload(id);
  return newCampaign || loaders.campaign.load(id);
}

async function updateInteractionSteps(
  campaignId,
  interactionSteps,
  origCampaignRecord,
  idMap = {}
) {
  for (let i = 0; i < interactionSteps.length; i++) {
    const is = interactionSteps[i];
    // map the interaction step ids for new ones
    if (idMap[is.parentInteractionId]) {
      is.parentInteractionId = idMap[is.parentInteractionId];
    }

    if (is.id.indexOf("new") !== -1) {
      const newIstep = await InteractionStep.save({
        parent_interaction_id: is.parentInteractionId || null,
        question: is.questionText,
        script: is.script,
        answer_option: is.answerOption,
        answer_actions: is.answerActions,
        campaign_id: campaignId,
        is_deleted: false
      });
      idMap[is.id] = newIstep.id;
    } else {
      if (!origCampaignRecord.is_started && is.isDeleted) {
        await r
          .knex("interaction_step")
          .where({ id: is.id })
          .delete();
      } else {
        await r
          .knex("interaction_step")
          .where({ id: is.id })
          .update({
            question: is.questionText,
            script: is.script,
            answer_option: is.answerOption,
            answer_actions: is.answerActions,
            is_deleted: is.isDeleted
          });
      }
    }

    if (Array.isArray(is.interactionSteps) && is.interactionSteps.length) {
      await updateInteractionSteps(
        campaignId,
        is.interactionSteps,
        origCampaignRecord,
        idMap
      );
    }
  }
}

const includeTags = info => {
  return true; // TODO LMP
};

const rootMutations = {
  RootMutation: {
    ...campaignMutations,
    ...labelMutations,
    ...organizationMutations,
    ...uploadContactMutations,
    userAgreeTerms: async (_, _unused, { user, loaders }) => {
      const currentUser = await r
        .table("user")
        .get(user.id)
        .update({
          terms: true
        });
      await cacheableData.user.clearUser(user.id, user.auth0_id);
      return currentUser;
    },

    sendReply: async (_, { id, message }, { user, loaders }) => {
      const contact = await loaders.campaignContact.load(id);
      const campaign = await loaders.campaign.load(contact.campaign_id);

      await accessRequired(user, campaign.organization_id, "ADMIN");

      const lastMessage = await r
        .table("message")
        .getAll(contact.assignment_id, { index: "assignment_id" })
        .filter({ contact_number: contact.cell })
        .limit(1)(0)
        .default(null);

      if (!lastMessage) {
        throw new GraphQLError({
          status: 400,
          message:
            "Cannot fake a reply to a contact that has no existing thread yet"
        });
      }

      const userNumber = lastMessage.user_number;
      const contactNumber = contact.cell;
      const mockId = `mocked_${Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "")}`;
      await saveNewIncomingMessage(
        new Message({
          contact_number: contactNumber,
          user_number: userNumber,
          is_from_contact: true,
          text: message,
          service_response: JSON.stringify({
            fakeMessage: true,
            userId: user.id,
            userFirstName: user.first_name
          }),
          service_id: mockId,
          assignment_id: lastMessage.assignment_id,
          service: lastMessage.service,
          send_status: "DELIVERED"
        })
      );
      return loaders.campaignContact.load(id);
    },
    exportCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      const organizationId = campaign.organization_id;
      await accessRequired(user, organizationId, "ADMIN");

      const newJob = await BackgroundJob.create({
        type: "export",
        campaignId: id,
        organizationId,
        userId: user.id,
        config: JSON.stringify({
          id,
          requester: user.id
        })
      });
      await dispatchJob(newJob);
      return newJob;
    },
    editOrganizationRoles: async (
      _,
      { userId, organizationId, roles },
      { user, loaders }
    ) => {
      const currentRoles = (
        await r
          .knex("user_organization")
          .where({
            organization_id: organizationId,
            user_id: userId
          })
          .select("role")
      ).map(res => res.role);
      const oldRoleIsOwner = currentRoles.indexOf("OWNER") !== -1;
      const newRoleIsOwner = roles.indexOf("OWNER") !== -1;
      const roleRequired = oldRoleIsOwner || newRoleIsOwner ? "OWNER" : "ADMIN";
      let newOrgRoles = [];

      await accessRequired(user, organizationId, roleRequired);

      currentRoles.forEach(async curRole => {
        if (roles.indexOf(curRole) === -1) {
          await r
            .knex("user_organization")
            .where({
              organization_id: organizationId,
              user_id: userId,
              role: curRole
            })
            .delete();
        }
      });

      newOrgRoles = roles
        .filter(newRole => currentRoles.indexOf(newRole) === -1)
        .map(newRole => ({
          organization_id: organizationId,
          user_id: userId,
          role: newRole
        }));

      if (newOrgRoles.length) {
        await UserOrganization.save(newOrgRoles, { conflict: "update" });
      }
      await cacheableData.user.clearUser(userId);
      return loaders.organization.load(organizationId);
    },
    editUser: async (_, { organizationId, userId, userData }, { user }) => {
      if (
        user.id !== userId ||
        (userData && userData.hasOwnProperty("email"))
      ) {
        // Users can edit their own name. Admins can edit the names and emails
        // of users in their orgs
        await accessRequired(user, organizationId, "ADMIN", true);
      }

      const userRes = await r.knex
        .select("user.id", "first_name", "last_name", "email", "auth0_id")
        .from("user")
        .join("user_organization", "user.id", "user_organization.user_id")
        .where({
          "user_organization.organization_id": organizationId,
          "user.id": userId
        })
        .limit(1);

      if (!userRes || !userRes.length) {
        return null;
      }

      const member = userRes[0];

      if (!userData) {
        // no mutation; just return the existing user
        return member;
      }

      // Mutate the user
      const updates = {
        first_name: userData.firstName,
        last_name: userData.lastName
      };

      if (userData.hasOwnProperty("email")) {
        updates.email = userData.email;
      }

      await r
        .knex("user")
        .where("id", userId)
        .update(updates);

      await cacheableData.user.clearUser(member.id, member.auth0_id);

      return {
        id: userId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email || null
      };
    },
    editSelf: async (__, { userData }, { user }) => {
      authRequired(user);

      const updatedUserRes = await r
        .knex("user")
        .where("id", user.id)
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          subscribed_to_reminders: userData.subscribedToReminders
        })
        .returning("*");

      const updatedUser = updatedUserRes[0];

      await cacheableData.user.clearUser(updatedUser.id, updatedUser.auth0_id);

      return _.pick(
        updatedUser,
        "id",
        "first_name",
        "last_name",
        "subscribed_to_reminders"
      );
    },
    resetUserPassword: async (_, { organizationId, userId }, { user }) => {
      if (user.id === userId) {
        throw new Error("You can't reset your own password.");
      }
      requireAuthStrategy("local");
      await accessRequired(user, organizationId, "ADMIN", true);

      // Add date at the end in case user record is modified after password is reset
      const passwordResetHash = uuidv4();
      const auth0_id = `reset|${passwordResetHash}|${Date.now()}`;

      const userRes = await r
        .knex("user")
        .where("id", userId)
        .update({
          auth0_id
        });
      return passwordResetHash;
    },
    changeUserPassword: async (_, { userId, formData }, { user }) => {
      if (user.id !== userId) {
        throw new Error("You can only change your own password.");
      }

      requireAuthStrategy("local");

      const { password, newPassword, passwordConfirm } = formData;

      const updatedUser = await change({
        user,
        password,
        newPassword,
        passwordConfirm
      });

      return updatedUser;
    },
    initiatePasswordReset: async (_, { organizationId, userId }, { user }) => {
      if (user.id !== userId) {
        await accessRequired(user, organizationId, "ADMIN", true);
      }

      requireAuthStrategy("auth0");

      const targetUser = await r.table("user").get(userId);

      const options = {
        method: "POST",
        url: `https://${process.env.AUTH0_DOMAIN}/dbconnections/change_password`,
        headers: { "content-type": "application/json" },
        body: {
          client_id: `${process.env.AUTH0_CLIENT_ID}`,
          email: targetUser.email,
          connection: "Username-Password-Authentication"
        },
        json: true
      };

      await request.post(options, (error, response, body) => {
        const successful = !error && response.statusCode === 200;
        if (!successful) {
          log.info(response.body);
        }
      });
      return true;
    },
    assignUserToCampaign: async (_, { token }, { user }) => {
      authRequired(user);
      // needs to be snake case to pass through the resolver
      const campaign = await db.Campaign.getByJoinToken(token, {
        snakeCase: true
      });
      if (!campaign) {
        throw new NotFoundError("Campaign not found");
      }
      if (campaign.is_archived) {
        throw new ApolloError(
          "This campaign is no longer active",
          "CAMPAIGN_ARCHIVED"
        );
      }

      const isMember = await db.User.isMemberOfOrganization(
        user.id,
        campaign.organization_id
      );
      if (!isMember) {
        await db.User.addToOrganization({
          userId: user.id,
          organizationId: campaign.organization_id,
          role: "TEXTER"
        });
      }

      let assignment = await db.Assignment.getByUserAndCampaign(
        user.id,
        campaign.id
      );

      if (!assignment) {
        // TODO: DRY this up, same code exists in server/api/campaign.js
        // putting this check here allows people who are already in the campaign
        // to use the link to get back to it.
        const contacts = await r
          .knex("campaign_contact")
          .select("id")
          .where({ campaign_id: campaign.id, assignment_id: null })
          .limit(1);
        const hasUnassignedContacts = contacts.length > 0;

        if (!hasUnassignedContacts) {
          throw new ApolloError("This campaign is full!", "CAMPAIGN_FULL");
        }

        assignment = await Assignment.save({
          user_id: user.id,
          campaign_id: campaign.id,
          // TODO: consider making this a property of the campaign
          max_contacts: process.env.MAX_CONTACTS_PER_TEXTER
            ? parseInt(process.env.MAX_CONTACTS_PER_TEXTER, 10)
            : null
        });
      }

      return assignment;
    },
    updateTextingHours: async (
      _,
      { organizationId, textingHoursStart, textingHoursEnd },
      { user }
    ) => {
      await accessRequired(user, organizationId, "OWNER");

      await Organization.get(organizationId).update({
        texting_hours_start: textingHoursStart,
        texting_hours_end: textingHoursEnd
      });
      await cacheableData.organization.clear(organizationId);

      return await Organization.get(organizationId);
    },
    updateTextingHoursEnforcement: async (
      _,
      { organizationId, textingHoursEnforced },
      { user, loaders }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");

      await Organization.get(organizationId).update({
        texting_hours_enforced: textingHoursEnforced
      });
      await cacheableData.organization.clear(organizationId);

      return await loaders.organization.load(organizationId);
    },
    createCampaign: async (
      _,
      { campaign, contactsS3Key, contactFileName },
      { user, loaders }
    ) => {
      await accessRequired(
        user,
        campaign.organizationId,
        "ADMIN",
        /* allowSuperadmin=*/ true
      );

      const campaignInstance = new Campaign({
        organization_id: campaign.organizationId,
        creator_id: user.id,
        title: campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false,
        use_dynamic_assignment: true,
        status: db.Campaign.Status.NOT_STARTED,
        contact_file_name: contactFileName
      });

      const newCampaign = await campaignInstance.save();

      await editCampaign(newCampaign.id, campaign, loaders, user);
      await uploadContactMutations.uploadContacts(
        null,
        { campaignId: newCampaign.id, s3Key: contactsS3Key },
        { user }
      );

      return newCampaign;
    },
    copyCampaign: async (
      _,
      { id, contactsS3Key, shiftingConfiguration, contactFileName },
      { user, loaders }
    ) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");

      const campaignInstance = new Campaign({
        organization_id: campaign.organization_id,
        creator_id: user.id,
        title: "COPY - " + campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false,
        shifting_configuration: shiftingConfiguration,
        logo_image_url: campaign.logo_image_url,
        intro_html: campaign.intro_html,
        use_dynamic_assignment: true,
        primary_color: campaign.primary_color,
        status: db.Campaign.Status.NOT_STARTED,
        contact_file_name: contactFileName
      });
      const newCampaign = await campaignInstance.save();
      const newCampaignId = newCampaign.id;
      const oldCampaignId = campaign.id;

      let interactions = await r
        .knex("interaction_step")
        .where({ campaign_id: oldCampaignId });

      const interactionsArr = [];
      interactions.forEach((interaction, index) => {
        if (interaction.parent_interaction_id) {
          let is = {
            id: "new" + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: "new" + interaction.parent_interaction_id
          };
          interactionsArr.push(is);
        } else if (!interaction.parent_interaction_id) {
          let is = {
            id: "new" + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: interaction.parent_interaction_id
          };
          interactionsArr.push(is);
        }
      });

      await updateInteractionSteps(
        newCampaignId,
        [makeTree(interactionsArr, (id = null))],
        campaign,
        {}
      );

      const oldCannedResponses = await r
        .knex("canned_response")
        .where({ campaign_id: oldCampaignId });

      const newLabels = [];

      await Promise.all(
        oldCannedResponses.map(async cr => {
          const copied = new CannedResponse({
            campaign_id: newCampaignId,
            title: cr.title,
            text: cr.text,
            survey_question: cr.survey_question,
            order: cr.order
          });

          const newResponse = await copied.save();

          (await db.CannedResponse.listLabels(cr.id)).forEach(label => {
            newLabels.push({
              cannedResponseId: newResponse.id,
              labelId: label.id
            });
          });

          return newResponse;
        })
      );

      await db.CannedResponse.bulkAddLabels(newLabels);

      await uploadContactMutations.uploadContacts(
        null,
        { campaignId: newCampaign.id, s3Key: contactsS3Key },
        { user }
      );

      return newCampaign;
    },
    // TODO[matteo]: might want to replace this with "closed" / "open"
    //  and remove the ability to unarchive
    unarchiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      campaign.is_archived = false;
      campaign.status = db.Campaign.Status.ACTIVE;
      await campaign.save();
      cacheableData.campaign.reload(id);
      return campaign;
    },
    archiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "ADMIN");
      campaign.is_archived = true;
      campaign.status = db.Campaign.Status.ARCHIVED;
      await campaign.save();
      cacheableData.campaign.reload(id);
      return campaign;
    },
    archiveCampaigns: async (_, { ids }, { user, loaders }) => {
      // Take advantage of the cache instead of running a DB query
      const campaigns = await Promise.all(
        ids.map(id => loaders.campaign.load(id))
      );

      await Promise.all(
        campaigns.map(campaign =>
          accessRequired(user, campaign.organization_id, "ADMIN")
        )
      );

      campaigns.forEach(campaign => {
        campaign.is_archived = true;
        campaign.status = db.Campaign.Status.ARCHIVED;
      });
      await Promise.all(campaigns.map(campaign => campaign.save()));
      return campaigns;
    },
    editCampaign: async (_, { id, campaign }, { user, loaders }) => {
      const origCampaign = await Campaign.get(id);
      if (campaign.organizationId) {
        await accessRequired(user, campaign.organizationId, "ADMIN");
      } else {
        await accessRequired(
          user,
          origCampaign.organization_id,
          "SUPERVOLUNTEER"
        );
      }

      if (
        origCampaign.is_started &&
        campaign.hasOwnProperty("phoneNumbers") &&
        campaign.phoneNumbers
      ) {
        throw new UserInputError(
          "Not allowed to edit phone numbers after the campaign has started"
        );
      }
      return editCampaign(id, campaign, loaders, user, origCampaign);
    },
    editCampaignContactMessageStatus: async (
      _,
      { messageStatus, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      await assignmentRequired(user, contact.assignment_id);
      contact.message_status = messageStatus;
      return await contact.save();
    },
    addTagsToCampaignContacts: async (
      _,
      { campaignContactIds, tags, comment },
      { loaders, user }
    ) => {
      const rows = tags.map(tag =>
        campaignContactIds.map(campaign_contact_id => ({
          campaign_contact_id,
          tag,
          created_by: user.id
        }))
      );

      await r.knex
        .transaction(async trx => {
          await r.knex
            .batchInsert("tag", flatten(rows))
            .transacting(trx)
            .catch(log.error);

          await r
            .knex("campaign_contact")
            .whereIn("id", campaignContactIds)
            .update({ has_unresolved_tags: true })
            .transacting(trx)
            .catch(log.error);
        })
        .catch(log.error);

      return true;
    },
    resolveTags: async (
      _,
      { campaignContactIds, tags, comment },
      { loaders, user }
    ) => {
      await r.knex
        .transaction(async trx => {
          await r
            .knex("tag")
            .whereIn("campaign_contact_id", campaignContactIds)
            .whereIn("tag", tags)
            .update({
              resolved_by: user.id,
              resolved_at: r.knex.fn.now()
            })
            .transacting(trx);

          const subQuery = r.knex
            .select("id")
            .from("tag")
            .whereRaw("tag.campaign_contact_id=campaign_contact.id")
            .whereNull("resolved_at");

          await r
            .knex("campaign_contact")
            .whereIn("id", campaignContactIds)
            .whereNotExists(subQuery)
            .update({ has_unresolved_tags: false })
            .transacting(trx)
            .catch(log.error);
        })
        .catch(log.error);

      return true;
    },
    findNewCampaignContact: async (
      _,
      { assignmentId, numberContacts },
      { user }
    ) => {
      /* This attempts to find a new contact for the assignment, in the case that useDynamicAssigment == true */
      const assignment = await Assignment.get(assignmentId);
      await assignmentRequired(user, assignmentId, assignment);

      const campaign = await Campaign.get(assignment.campaign_id);
      if (!campaign.use_dynamic_assignment || assignment.max_contacts === 0) {
        return { found: false };
      }

      const contactsCount = await r.getCount(
        r.knex("campaign_contact").where("assignment_id", assignmentId)
      );

      const maxSize = config.DYNAMIC_ASSIGN_MAX_BATCH_SIZE;
      numberContacts = numberContacts
        ? Math.min(numberContacts, maxSize)
        : maxSize;
      if (
        assignment.max_contacts &&
        contactsCount + numberContacts > assignment.max_contacts
      ) {
        numberContacts = assignment.max_contacts - contactsCount;
      }

      log.info(
        `Assigning ${numberContacts} to user ${user.id} on assignment ${assignmentId}`
      );

      // TODO[matteo]: simplify by only allowing a batch to be requested
      // if someone has zero unmessaged contacts
      // Don't add more if they already have that many
      const result = await r.getCount(
        r.knex("campaign_contact").where({
          assignment_id: assignmentId,
          message_status: "needsMessage",
          is_opted_out: false
        })
      );
      if (result >= numberContacts) {
        return { found: false };
      }

      const updatedCount = await r
        .knex("campaign_contact")
        .where(
          "id",
          "in",
          r
            .knex("campaign_contact")
            .where({
              assignment_id: null,
              campaign_id: campaign.id
            })
            .limit(numberContacts)
            .select("id")
        )
        .update({ assignment_id: assignmentId })
        .catch(log.error);

      if (updatedCount > 0) {
        return { found: true };
      }
      return { found: false };
    },

    createOptOut: async (
      _,
      { optOut, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      const campaign = await loaders.campaign.load(contact.campaign_id);
      try {
        await assignmentRequired(user, contact.assignment_id);
      } catch (e) {
        if (e instanceof ForbiddenError) {
          await accessRequired(user, campaign.organization_id, "ADMIN");
        } else {
          throw e;
        }
      }

      const { assignmentId, cell, reason } = optOut;
      let organizationId = contact.organization_id;

      if (!organizationId) {
        const campaign = await loaders.campaign.load(contact.campaign_id);
        organizationId = campaign.organization_id;
      }
      await db.OptOut.create({
        cell,
        reason_code: reason,
        assignment_id: assignmentId,
        organization_id: organizationId
      });

      return {
        id: campaignContactId
      };
    },

    bulkCreateOptOuts: async (
      _,
      { cells, organizationId, reasonCode },
      { user }
    ) => {
      if (cells.length > 100) {
        throw new ApolloError(
          "Can't bulk opt out more than 100 phones at a time",
          "BULK_OPT_OUT_LIMIT_EXCEEDED"
        );
      }
      await accessRequired(user, organizationId, "ADMIN");

      await db.OptOut.createBulk({
        cells,
        reason_code: reasonCode,
        organization_id: organizationId
      });

      return true;
    },

    sendMessage: async (
      _,
      { message, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      const campaign = await loaders.campaign.load(contact.campaign_id);
      await accessRequired(user, campaign.organization_id, "TEXTER");

      if (
        campaign.is_archived ||
        campaign.status === db.Campaign.Status.ARCHIVED
      ) {
        throw new CampaignArchivedError("This campaign is no longer active");
      }

      if (
        campaign.status &&
        !(
          campaign.status === db.Campaign.Status.ACTIVE ||
          campaign.status === db.Campaign.Status.CLOSED_FOR_INITIAL_SENDS
        )
      ) {
        throw new ApolloError(
          `Invalid status for sendMessage: ${campaign.status}`,
          `CAMPAIGN_${campaign.status}`
        );
      }

      if (contact.assignment_id !== parseInt(message.assignmentId, 10)) {
        throw new NotFoundError("Your assignment has changed");
      }

      const organization = await r
        .table("campaign")
        .get(contact.campaign_id)
        .eqJoin(
          "organization_id",
          r.table("organization")
        )("right");

      const orgFeatures = JSON.parse(organization.features || "{}");

      const optedOut = await db.OptOut.isOptedOut({
        cell: contact.cell,
        organization_id: organization.id
      });

      if (optedOut) {
        throw new ApolloError(
          "Skipped sending because this contact was already opted out",
          "OPTED_OUT"
        );
      }

      const { text, isInitialMessage } = message;
      // TODO[matteo]: don't allow the frontend to pass the contact number
      const contactNumber = contact.cell || message.contactNumber;

      if (text.length > (process.env.MAX_MESSAGE_LENGTH || 99999)) {
        throw new UserInputError("Message was longer than the limit");
      }

      const replaceCurlyApostrophes = rawText =>
        rawText.replace(/[\u2018\u2019]/g, "'");

      let contactTimezone = {};
      if (contact.timezone_offset) {
        // couldn't look up the timezone by zip record, so we load it
        // from the campaign_contact directly if it's there
        const [offset, hasDST] = contact.timezone_offset.split("_");
        contactTimezone.offset = parseInt(offset, 10);
        contactTimezone.hasDST = hasDST === "1";
      }

      const sendBefore = getSendBeforeTimeUtc(
        contactTimezone,
        {
          textingHoursEnd: organization.texting_hours_end,
          textingHoursEnforced: organization.texting_hours_enforced
        },
        {
          textingHoursEnd: campaign.texting_hours_end,
          overrideOrganizationTextingHours:
            campaign.override_organization_texting_hours,
          textingHoursEnforced: campaign.texting_hours_enforced,
          timezone: campaign.timezone
        }
      );

      const sendBeforeDate = sendBefore ? sendBefore.toDate() : null;

      if (sendBeforeDate && sendBeforeDate <= Date.now()) {
        throw new ApolloError(
          "Outside permitted texting time for this recipient",
          "TEXTING_HOURS"
        );
      }

      await messageDedupe(contact, message, isInitialMessage);

      const messageInstance = new Message({
        text: replaceCurlyApostrophes(text),
        contact_number: contactNumber,
        user_number: "",
        user_id: user.id,
        assignment_id: message.assignmentId,
        send_status: "SENDING",
        service: orgFeatures.service || process.env.DEFAULT_SERVICE || "",
        is_from_contact: false,
        queued_at: new Date(),
        send_before: sendBeforeDate,
        canned_response_id: message.cannedResponseId
      });
      // NOTE: save is deferred to after duplicate message detection

      // TODO: get rid of service map
      const sendingServiceName =
        messageInstance.service ||
        process.env.DEFAULT_SERVICE ||
        global.DEFAULT_SERVICE;

      const service = serviceMap[sendingServiceName];

      // TODO: migrate these models off of thinky and do this in a proper transaction
      // NOTE: CLOSED_FOR_INITIAL_SENDS enforcement trusts the frontend to send back
      //   the isIntialMessage flag correctly. A malicious user could get around it.
      if (isInitialMessage) {
        if (campaign.status === db.Campaign.Status.CLOSED_FOR_INITIAL_SENDS) {
          throw new ApolloError(
            "Closed for initial sends",
            "CAMPAIGN_CLOSED_FOR_INITIAL_SENDS"
          );
        }
        // keep this check despite the redis dedupe in order to catch re-assignment
        // weirdness
        await r.knex.transaction(async trx => {
          const countUpdated = await trx("campaign_contact")
            .update({
              message_status: "messaged",
              updated_at: new Date()
            })
            .where({
              id: contact.id,
              message_status: "needsMessage"
            });

          if (countUpdated !== 1) {
            throw new ApolloError(
              "Duplicate initial message",
              "DUPLICATE_MESSAGE"
            );
          }
          // Save message to db, if this throws the contact will remain in state
          // needsMessage
          await messageInstance.save();
        });
      } else {
        contact.updated_at = new Date();
        if (
          contact.message_status === "needsResponse" ||
          contact.message_status === "convo"
        ) {
          contact.message_status = "convo";
        } else {
          contact.message_status = "messaged";
        }
        await contact.save();
        await messageInstance.save(); // save message, not transactional
      }

      log.debug({
        msg: "Sending message",
        sendingServiceName,
        messageInstance
      });

      await service.sendMessage(messageInstance, contact);
      return contact;
    },
    deleteQuestionResponses: async (
      _,
      { interactionStepIds, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId);
      await assignmentRequired(user, contact.assignment_id);
      // TODO: maybe undo action_handler
      await r
        .table("question_response")
        .getAll(campaignContactId, { index: "campaign_contact_id" })
        .getAll(...interactionStepIds, { index: "interaction_step_id" })
        .delete();
      return contact;
    },
    updateQuestionResponses: async (
      _,
      { questionResponses, campaignContactId },
      { loaders }
    ) => {
      const count = questionResponses.length;

      for (let i = 0; i < count; i++) {
        const questionResponse = questionResponses[i];
        const { interactionStepId, value } = questionResponse;
        await r
          .table("question_response")
          .getAll(campaignContactId, { index: "campaign_contact_id" })
          .filter({ interaction_step_id: interactionStepId })
          .delete();

        // TODO: maybe undo action_handler if updated answer

        const qr = await new QuestionResponse({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStepId,
          value
        }).save();
        const interactionStepResult = await r
          .knex("interaction_step")
          // TODO: is this really parent_interaction_id or just interaction_id?
          .where({
            parent_interaction_id: interactionStepId,
            answer_option: value
          })
          .whereNot("answer_actions", "")
          .whereNotNull("answer_actions");

        const interactionStepAction =
          interactionStepResult.length &&
          interactionStepResult[0].answer_actions;
        if (interactionStepAction) {
          // run interaction step handler
          try {
            const handler = require(`../action_handlers/${interactionStepAction}.js`);
            handler.processAction(
              qr,
              interactionStepResult[0],
              campaignContactId
            );
          } catch (err) {
            log.error(
              "Handler for InteractionStep",
              interactionStepId,
              "Does Not Exist:",
              interactionStepAction
            );
          }
        }
      }

      const contact = loaders.campaignContact.load(campaignContactId);
      return contact;
    },
    reassignCampaignContacts: async (
      _,
      { organizationId, campaignIdsContactIds, newTexterUserId },
      { user }
    ) => {
      // verify permissions
      await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);

      // group contactIds by campaign
      // group messages by campaign
      const campaignIdContactIdsMap = new Map();
      const campaignIdMessagesIdsMap = new Map();
      for (const campaignIdContactId of campaignIdsContactIds) {
        const {
          campaignId,
          campaignContactId,
          messageIds
        } = campaignIdContactId;

        if (!campaignIdContactIdsMap.has(campaignId)) {
          campaignIdContactIdsMap.set(campaignId, []);
        }

        campaignIdContactIdsMap.get(campaignId).push(campaignContactId);

        if (!campaignIdMessagesIdsMap.has(campaignId)) {
          campaignIdMessagesIdsMap.set(campaignId, []);
        }

        campaignIdMessagesIdsMap.get(campaignId).push(...messageIds);
      }

      return await reassignConversations(
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap,
        newTexterUserId
      );
    },
    bulkReassignCampaignContacts: async (
      _,
      {
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        newTexterUserId
      },
      { user }
    ) => {
      // verify permissions
      await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);
      const {
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap
      } = await getCampaignIdMessageIdsAndCampaignIdContactIdsMaps(
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter
      );

      return await reassignConversations(
        campaignIdContactIdsMap,
        campaignIdMessagesIdsMap,
        newTexterUserId
      );
    },
    addUserToOrganizationByEmail: async (
      _,
      { organizationId, email, role },
      { user }
    ) => {
      const roleRequired = role === "OWNER" ? "OWNER" : "ADMIN";
      await accessRequired(user, organizationId, roleRequired);

      const userRes = await db.User.getByEmail(email);

      if (!userRes) {
        return "NO_USER_WITH_EMAIL";
      }

      const userId = userRes.id;
      const isMember = await db.User.isMemberOfOrganization(
        userId,
        organizationId
      );

      if (isMember) {
        return "USER_ALREADY_IN_ORG";
      }

      await db.User.addToOrganization({ userId, organizationId, role });

      return "USER_ADDED";
    },
    buyNumbers: async (_, { areaCode, limit }, { user }) => {
      await superAdminRequired(user);
      const job = await BackgroundJob.create({
        type: "buy_numbers",
        campaignId: null,
        organizationId: null,
        userId: user.id,
        config: JSON.stringify({ areaCode, limit })
      });
      await dispatchJob(job);
      return job;
    }
  }
};

// TODO: move to its own file
const rootResolvers = {
  Action: {
    name: o => o.name,
    display_name: o => o.display_name,
    instructions: o => o.instructions
  },
  FoundContact: {
    found: o => o.found
  },
  RootQuery: {
    campaign: async (_, { id }, { loaders, user }) => {
      const campaign = await loaders.campaign.load(id);
      await accessRequired(user, campaign.organization_id, "SUPERVOLUNTEER");
      return campaign;
    },
    assignment: async (_, { id }, { loaders, user }) => {
      authRequired(user);
      const assignment = await loaders.assignment.load(id);
      if (!assignment) {
        throw new NotFoundError(
          `Missing assignment for user ${user ? user.id : user}`
        );
      }

      const campaign = await loaders.campaign.load(assignment.campaign_id);
      if (assignment.user_id === user.id) {
        await accessRequired(
          user,
          campaign.organization_id,
          "TEXTER",
          /* allowSuperadmin=*/ true
        );
      } else {
        await accessRequired(
          user,
          campaign.organization_id,
          "SUPERVOLUNTEER",
          /* allowSuperadmin=*/ true
        );
      }
      return assignment;
    },
    organization: async (_, { id }, { loaders }) =>
      loaders.organization.load(id),
    currentUser: async (_, { allowNull }, { user }) => {
      if (!allowNull) {
        authRequired(user);
      }

      return user || null;
    },
    currentUserWithAccess: async (_, { organizationId, role }, { user }) => {
      await accessRequired(user, organizationId, role, false);
      return user;
    },
    contact: async (_, { id }, { loaders, user }) => {
      authRequired(user);
      const contact = await loaders.campaignContact.load(id);
      const campaign = await loaders.campaign.load(contact.campaign_id);
      await accessRequired(
        user,
        campaign.organization_id,
        "TEXTER",
        /* allowSuperadmin=*/ true
      );
      return contact;
    },
    contactsForAssignment: async (
      _,
      { assignmentId, contactsFilter },
      { loaders, user }
    ) => {
      authRequired(user);
      const assignment = await loaders.assignment.load(assignmentId);
      if (!assignment) {
        throw new NotFoundError(
          `Missing assignment for user ${user ? user.id : user}`
        );
      }
      const campaign = await loaders.campaign.load(assignment.campaign_id);

      if (assignment.user_id === user.id) {
        await accessRequired(
          user,
          campaign.organization_id,
          "TEXTER",
          /* allowSuperadmin=*/ true
        );
      } else {
        await accessRequired(
          user,
          campaign.organization_id,
          "SUPERVOLUNTEER",
          /* allowSuperadmin=*/ true
        );
      }

      const organization = await r
        .table("organization")
        .get(campaign.organization_id);

      return getContacts(assignment, contactsFilter, organization, campaign);
    },
    organizations: async (_, { id }, { user }) => {
      await superAdminRequired(user);
      return r.table("organization");
    },
    availableActions: (_, { organizationId }, { user }) => {
      if (!process.env.ACTION_HANDLERS) {
        return [];
      }
      const allHandlers = process.env.ACTION_HANDLERS.split(",");

      const availableHandlers = allHandlers
        .map(handler => {
          return {
            name: handler,
            handler: require(`../action_handlers/${handler}.js`)
          };
        })
        .filter(async h => h && (await h.handler.available(organizationId)));

      const availableHandlerObjects = availableHandlers.map(handler => {
        return {
          name: handler.name,
          display_name: handler.handler.displayName(),
          instructions: handler.handler.instructions()
        };
      });
      return availableHandlerObjects;
    },
    conversations: async (
      _,
      {
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        utc
      },
      context,
      info
    ) => {
      const { user } = context;

      if (
        !assignmentsFilter ||
        get(assignmentsFilter, "texterId") !== user.id
      ) {
        await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);
      }

      return getConversations(
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        includeTags(info)
      );
    },
    campaigns: async (
      _,
      { organizationId, cursor, campaignsFilter },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getCampaigns(organizationId, cursor, campaignsFilter);
    },
    people: async (
      _,
      {
        organizationId,
        cursor,
        campaignsFilter,
        role,
        sortBy,
        filterString,
        filterBy
      },
      { user }
    ) => {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER");
      return getUsers(
        organizationId,
        cursor,
        campaignsFilter,
        role,
        sortBy,
        filterString,
        filterBy
      );
    },
    backgroundJob: async (_, { jobId }, { user }) => {
      const job = await BackgroundJob.get(jobId);
      if (!job) {
        return null;
      }

      if (job.userId !== user.id) {
        await accessRequired(user, job.organizationId, "SUPERVOLUNTEER");
      }

      return job;
    }
  }
};

export const resolvers = {
  ...rootResolvers,
  ...userResolvers,
  ...organizationResolvers,
  ...campaignResolvers,
  ...assignmentResolvers,
  ...interactionStepResolvers,
  ...optOutResolvers,
  ...labelResolvers,
  ...messageResolvers,
  ...campaignContactResolvers,
  ...cannedResponseResolvers,
  ...questionResponseResolvers,
  ...{ Date: GraphQLDate },
  ...{ DateTime: GraphQLDateTime },
  ...{ JSON: GraphQLJSON },
  ...{ Phone: GraphQLPhone },
  ...questionResolvers,
  ...conversationsResolver,
  ...rootMutations
};
