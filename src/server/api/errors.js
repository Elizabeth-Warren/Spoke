import { GraphQLError } from "graphql/error";
import { r, cacheableData } from "../models";
import log from "src/server/log";

// Application errors, resembling Apollo 2 errors:
// https://www.apollographql.com/docs/apollo-server/data/errors/
export class ApolloError extends Error {
  constructor(message, code) {
    super(message);
    if (!this.name) {
      this.name = "ApolloError";
    }
    this.code = code || "INTERNAL_SERVER_ERROR";
  }
}

export class ForbiddenError extends ApolloError {
  constructor(message) {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class SuspendedError extends ApolloError {
  constructor(message) {
    super(message, "SUSPENDED");
    this.name = "SuspendedError";
  }
}

export class UserInputError extends ApolloError {
  constructor(message) {
    super(message, "BAD_USER_INPUT");
    this.name = "UserInputError";
  }
}

export function authRequired(user) {
  if (!user) {
    throw new ApolloError(
      "You must login to access that resource.",
      "UNAUTHORIZED"
    );
  }
}

export async function accessRequired(
  user,
  orgId,
  role,
  allowSuperadmin = false
) {
  authRequired(user);
  if (!orgId) {
    throw new ApolloError("orgId not passed correctly to accessRequired");
  }
  if (allowSuperadmin && user.is_superadmin) {
    return;
  }
  // require a permission at-or-higher than the permission requested
  const hasRole = await cacheableData.user.userHasRole(user, orgId, role);
  if (!hasRole) {
    const isSuspended =
      (await cacheableData.user.userOrgHighestRole(user.id, orgId)) ===
      "SUSPENDED";

    if (isSuspended) {
      throw new SuspendedError(
        "Your account has been suspended. Please contact a Text Team Leader in the Slack."
      );
    } else {
      throw new ForbiddenError(
        "You are not authorized to access that resource."
      );
    }
  }
}

export async function assignmentRequired(user, assignmentId, assignment) {
  authRequired(user);

  if (user.is_superadmin) {
    return true;
  }
  if (assignment && assignment.user_id === user.id) {
    // if we are passed the full assignment object, we can test directly
    return true;
  }

  const [userHasAssignment] = await r
    .knex("assignment")
    .where({
      user_id: user.id,
      id: assignmentId
    })
    .limit(1);

  if (!userHasAssignment) {
    // undefined or null
    throw new ForbiddenError("You are not authorized to access that resource.");
  }
  return true;
}

export async function assignmentAndNotSuspended(
  organizationId,
  user,
  assignmentId,
  assignment,
  allowSupervolunteer = true
) {
  try {
    await accessRequired(user, organizationId, "TEXTER");
    await assignmentRequired(user, assignmentId, assignment);
  } catch (e) {
    log.info(typeof e);
    if (e instanceof GraphQLError && allowSupervolunteer) {
      await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);
    } else {
      throw e;
    }
  }

  return true;
}

export function superAdminRequired(user) {
  authRequired(user);

  if (!user.is_superadmin) {
    throw new ForbiddenError("You need to be a super-adminstrator to do that.");
  }
}

export function requireAuthStrategy(strategy) {
  if (process.env.PASSPORT_STRATEGY !== strategy) {
    throw new ForbiddenError(
      "Password reset is only available for Auth0 login."
    );
  }
}
