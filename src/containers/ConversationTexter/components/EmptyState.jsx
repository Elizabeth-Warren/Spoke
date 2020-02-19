import React from "react";
import types from "prop-types";
import { StyleSheet, css } from "aphrodite";

import SMSIcon from "material-ui/svg-icons/notification/sms";

import RequestBatchButton from "src/containers/RequestBatchButton";
import Empty from "src/components/Empty";

import ContactToolbar from "./ContactToolbar";

const styles = StyleSheet.create({
  topSpacing: {
    marginTop: "30px"
  },

  toolbarWrapper: {
    width: "100%"
  },

  fullHeight: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between"
  }
});

export default function EmptyState({ campaign, assignment, organizationId }) {
  return (
    <div className={css(styles.fullHeight)}>
      <div className={css(styles.toolbarWrapper)}>
        <ContactToolbar
          campaign={campaign}
          campaignContact={null}
          assignment={null}
        />
      </div>
      <Empty title="No Active Conversations" icon={<SMSIcon />}>
        <p className={css(styles.topSpacing)}>
          There's nobody to reply to yet. Replies will show up on this page
          automatically as they arrive.
        </p>

        {campaign.useDynamicAssignment &&
        campaign.hasUnassignedContactsForTexter ? (
          <div className={css(styles.topSpacing)}>
            <p>While you're waiting, you can</p>
            <RequestBatchButton
              organizationId={organizationId}
              assignmentId={assignment.id}
              buttonLabel="Send Another Batch"
            />
          </div>
        ) : null}
      </Empty>

      {/* Extra div so the empty dialog ends up in the middle with flex layout space-between */}
      <div />
    </div>
  );
}

EmptyState.propTypes = {
  campaign: types.object,
  assignment: types.object,
  organizationId: types.string
};
