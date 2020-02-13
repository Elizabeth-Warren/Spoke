import { r, Assignment } from "../models";
import log from "src/server/log";
import { Notifications, sendUserNotification } from "../notifications";

export async function assignTexters(job) {
  // Assigns UNassigned campaign contacts to texters
  // It does NOT re-assign contacts to other texters
  // STEPS:
  // 1. get currentAssignments = all current assignments
  //       .needsMessageCount = contacts that haven't been contacted yet
  // 2. changedAssignments = assignments where texter was removed or needsMessageCount different
  //                  needsMessageCount differ possibilities:
  //                  a. they started texting folks, so needsMessageCount is less
  //                  b. they were assigned a different number by the admin
  // 3. update changed assignments (temporarily) not to be in needsMessage status
  // 4. availableContacts: count of contacts without an assignment
  // 5. forEach texter:
  //        * skip if 'unchanged'
  //        * if new texter, create assignment record
  //        * update X needsMessage campaign_contacts with texter's assignment record
  //             (min of needsMessageCount,availableContacts)
  // 6. delete assignments with a 0 assignment count
  // SCENARIOS:
  // * deleted texter:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter, so all contacts are set assignment_id=null
  // * texter with fewer count:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter: all current contacts are removed
  //   iterating over texter, the currentAssignment re-assigns needsMessageCount more texters
  // * new texter
  //   no current/changed assignment
  //   iterating over texter, assignment is created, then apportioned needsMessageCount texters

  /*
  A. clientMessagedCount  or serverMessagedCount: # of contacts assigned and already texted (for a texter)
    aka clientMessagedCount / serverMessagedCount
  B. needsMessageCount: # of contacts assigned but not yet texted (for a texter)
  C. max contacts (for a texter)
  D. pool of unassigned and assignable texters
    aka availableContacts

  In dynamic assignment mode:
    Add new texter
      Create assignment
    Change C
      if new C >= A and new C <> old C:
        Update assignment
      if new C >= A and new C = old C:
        No change
      if new C < A or new C = 0:
        Why are we doing this? If we want to keep someone from texting any more,
          we set their max_contacts to 0, and manually re-assign any of their
          previously texted contacts in the Message Review admin.
          TODO: Form validation should catch the case where C < A.
    Delete texter
      Assignment form currently prevents this (though it might be okay if A = 0).
      To stop a texter from texting any more in the campaign,
      set their max to zero and re-assign their contacts to another texter.

  In standard assignment mode:
    Add new texter
      Create assignment
      Assign B contacts
    Change B
      if new B > old B:
        Update assignment
        Assign (new B - old B) contacts
      if new B = old B:
        No change
      if new B < old B:
        Update assignment
        Unassign (old B - new B) untexted contacts
      if new B = 0:
        Update assignment
    Delete texter
      Not sure we allow this?

  TODO: what happens when we switch modes? Do we allow it?
  */
  const payload = JSON.parse(job.config);
  const cid = job.campaignId;
  const campaign = (await r.knex("campaign").where({ id: cid }))[0];
  const texters = payload.texters;
  const currentAssignments = await r
    .knex("assignment")
    .where("assignment.campaign_id", cid)
    .joinRaw(
      "left join campaign_contact allcontacts" +
        " ON (allcontacts.assignment_id = assignment.id)"
    )
    .groupBy("user_id", "assignment.id")
    .select(
      "user_id",
      "assignment.id as id",
      r.knex.raw(
        "SUM(CASE WHEN allcontacts.message_status = 'needsMessage' THEN 1 ELSE 0 END) as needs_message_count"
      ),
      r.knex.raw("COUNT(allcontacts.id) as full_contact_count"),
      "max_contacts"
    )
    .catch(log.error);

  const unchangedTexters = {}; // max_contacts and needsMessageCount unchanged
  const demotedTexters = {}; // needsMessageCount reduced
  const dynamic = campaign.use_dynamic_assignment;
  // detect changed assignments
  currentAssignments
    .map(assignment => {
      const texter = texters.filter(
        texter => parseInt(texter.id, 10) === assignment.user_id
      )[0];
      if (texter) {
        const unchangedMaxContacts =
          parseInt(texter.maxContacts, 10) === assignment.max_contacts || // integer = integer
          texter.maxContacts === assignment.max_contacts; // null = null
        const unchangedNeedsMessageCount =
          texter.needsMessageCount ===
          parseInt(assignment.needs_message_count, 10);
        if (
          (!dynamic && unchangedNeedsMessageCount) ||
          (dynamic && unchangedMaxContacts)
        ) {
          unchangedTexters[assignment.user_id] = true;
          return null;
        } else if (!dynamic) {
          // standard assignment change
          // If there is a delta between client and server, then accommodate delta (See #322)
          const clientMessagedCount =
            texter.contactsCount - texter.needsMessageCount;
          const serverMessagedCount =
            assignment.full_contact_count - assignment.needs_message_count;

          const numDifferent =
            (texter.needsMessageCount || 0) -
            assignment.needs_message_count -
            Math.max(0, serverMessagedCount - clientMessagedCount);

          if (numDifferent < 0) {
            // got less than before
            demotedTexters[assignment.id] = -numDifferent;
          } else {
            // got more than before: assign the difference
            texter.needsMessageCount = numDifferent;
          }
        }
        return assignment;
      } else {
        // deleted texter
        demotedTexters[assignment.id] = assignment.needs_message_count;
        return assignment;
      }
    })
    .filter(ele => ele !== null);

  for (const assignId in demotedTexters) {
    // Here we unassign ALL the demotedTexters contacts (not just the demotion count)
    // because they will get reapportioned below
    await r
      .knex("campaign_contact")
      .where(
        "id",
        "in",
        r
          .knex("campaign_contact")
          .where("assignment_id", assignId)
          .where("message_status", "needsMessage")
          .select("id")
      )
      .update({ assignment_id: null })
      .catch(log.error);
  }

  // await updateJob(job, 20);

  let availableContacts = await r
    .table("campaign_contact")
    .getAll(null, { index: "assignment_id" })
    .filter({ campaign_id: cid })
    .count();
  // Go through all the submitted texters and create assignments
  const texterCount = texters.length;

  for (let index = 0; index < texterCount; index++) {
    const texter = texters[index];
    const texterId = parseInt(texter.id, 10);
    let maxContacts = null; // no limit

    if (texter.maxContacts || texter.maxContacts === 0) {
      maxContacts = Math.min(
        parseInt(texter.maxContacts, 10),
        parseInt(process.env.MAX_CONTACTS_PER_TEXTER || texter.maxContacts, 10)
      );
    } else if (process.env.MAX_CONTACTS_PER_TEXTER) {
      maxContacts = parseInt(process.env.MAX_CONTACTS_PER_TEXTER, 10);
    }

    if (unchangedTexters[texterId]) {
      continue;
    }

    const contactsToAssign = Math.min(
      availableContacts,
      texter.needsMessageCount
    );

    if (contactsToAssign === 0) {
      // avoid creating a new assignment when the texter should get 0
      if (!campaign.use_dynamic_assignment) {
        continue;
      }
    }
    availableContacts = availableContacts - contactsToAssign;
    const existingAssignment = currentAssignments.find(
      ele => ele.user_id === texterId
    );
    let assignment = null;
    if (existingAssignment) {
      if (!dynamic) {
        assignment = new Assignment({
          id: existingAssignment.id,
          user_id: existingAssignment.user_id,
          campaign_id: cid
        }); // for notification
      } else {
        await r
          .knex("assignment")
          .where({ id: existingAssignment.id })
          .update({ max_contacts: maxContacts });
      }
    } else {
      assignment = await new Assignment({
        user_id: texterId,
        campaign_id: cid,
        max_contacts: maxContacts
      }).save();
    }

    if (!campaign.use_dynamic_assignment) {
      await r
        .knex("campaign_contact")
        .where(
          "id",
          "in",
          r
            .knex("campaign_contact")
            .where({ assignment_id: null, campaign_id: cid })
            .limit(contactsToAssign)
            .select("id")
        )
        .update({
          assignment_id: assignment.id
        })
        .catch(log.error);

      if (existingAssignment) {
        // We can't rely on an observer because nothing
        // about the actual assignment object changes
        await sendUserNotification({
          type: Notifications.ASSIGNMENT_UPDATED,
          assignment
        });
      }
    }

    // await updateJob(job, Math.floor((75 / texterCount) * (index + 1)) + 20);
  } // endfor

  if (!campaign.use_dynamic_assignment) {
    // dynamic assignments, having zero initially is ok
    const assignmentsToDelete = r
      .knex("assignment")
      .where("assignment.campaign_id", cid)
      .leftJoin(
        "campaign_contact",
        "assignment.id",
        "campaign_contact.assignment_id"
      )
      .groupBy("assignment.id")
      .havingRaw("COUNT(campaign_contact.id) = 0")
      .select("assignment.id as id");

    await r
      .knex("assignment")
      .where("id", "in", assignmentsToDelete)
      .delete()
      .catch(log.error);
  }

  // if (job.id) {
  //   await r
  //     .table("job_request")
  //     .get(job.id)
  //     .delete();
  // }
}
