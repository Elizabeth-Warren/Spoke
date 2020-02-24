import types from "prop-types";
import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";
import { StyleSheet, css } from "aphrodite";

import { Card, CardActions, CardTitle } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import Badge from "material-ui/Badge";
import Divider from "material-ui/Divider";

import { withRouter } from "react-router";

import { dataTest } from "src/lib/attributes";
import theme from "src/styles/theme";
import RequestBatchButton from "src/containers/RequestBatchButton";
import { getBlackOrWhiteTextForBg } from "src/lib/color-helpers";
import { campaignIsBetweenTextingHours } from "src/lib";

const inlineStyles = {
  badge: {
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  },
  pastMsgStyle: {
    backgroundColor: theme.colors.EWnavy,
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  }
};

const styles = StyleSheet.create({
  container: {
    margin: "20px 0"
  },
  image: {
    position: "absolute",
    height: "70%",
    top: "20px",
    right: "20px"
  }
});

export class AssignmentSummary extends Component {
  static propTypes = {
    organizationId: types.string,
    router: types.object,
    assignment: types.object,
    contactCounts: types.array
  };

  goToTodos(contactsFilter, assignmentId) {
    const { organizationId, router } = this.props;

    if (contactsFilter) {
      router.push(
        `/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`
      );
    }
  }

  renderBadgedButton({
    dataTestText,
    assignment,
    title,
    count,
    primary,
    disabled,
    contactsFilter,
    hideIfZero,
    style
  }) {
    if (count === 0 && hideIfZero) {
      return "";
    }
    if (count === 0) {
      return (
        <RaisedButton
          {...dataTest(dataTestText)}
          disabled={disabled}
          label={title}
          primary={primary && !disabled}
          onClick={() => this.goToTodos(contactsFilter, assignment.id)}
        />
      );
    } else {
      return (
        <Badge
          key={title}
          badgeStyle={style || inlineStyles.badge}
          badgeContent={count || ""}
          primary={primary && !disabled}
          secondary={!primary && !disabled}
        >
          <RaisedButton
            {...dataTest(dataTestText)}
            disabled={disabled}
            label={title}
            onClick={() => this.goToTodos(contactsFilter, assignment.id)}
          />
        </Badge>
      );
    }
  }

  render() {
    const { assignment, organizationId, contactCounts } = this.props;

    const {
      title,
      description,
      hasUnassignedContactsForTexter,
      dueBy,
      primaryColor,
      logoImageUrl,
      introHtml,
      useDynamicAssignment,
      status
    } = assignment.campaign;

    const isWithinTextingHours = campaignIsBetweenTextingHours(
      assignment.campaign
    );

    const counts = _.chain(contactCounts)
      .keyBy("messageStatus")
      .mapValues("count")
      .value();

    const unmessagedCount = counts.needsMessage || 0;

    const conversationCount = _.sum([
      0,
      counts.convo,
      counts.needsResponse,
      counts.closed
    ]);

    const needsResponseCount = counts.needsResponse || 0;

    const textColor =
      (primaryColor && getBlackOrWhiteTextForBg(primaryColor)) || null;
    // TODO: style summaries based on campaign status.
    //  In particular, if a campaign is CLOSED_FOR_INITIAL_SENDS and there are
    //  no conversations, or if a campaign is CLOSED_FOR_ALL_SENDS, the card
    //  will have no buttons
    const renderRequestBatchButton =
      status === "ACTIVE" &&
      isWithinTextingHours &&
      (unmessagedCount > 0 || !needsResponseCount);

    const batchRequestButtonDisabled =
      !hasUnassignedContactsForTexter && unmessagedCount === 0;

    const renderConversationsButton =
      (status === "ACTIVE" || status === "CLOSED_FOR_INITIAL_SENDS") &&
      isWithinTextingHours &&
      conversationCount > 0;

    let requestBatchButtonLabel;
    if (unmessagedCount > 0) {
      requestBatchButtonLabel = "Finish Text Batch";
    } else if (batchRequestButtonDisabled) {
      requestBatchButtonLabel = "All Batches Sent";
    } else {
      requestBatchButtonLabel = "Send Initial Texts";
    }

    return (
      <div className={css(styles.container)}>
        <Card key={assignment.id}>
          <CardTitle
            title={title}
            subtitle={`${description} - ${moment(dueBy)
              .utc()
              .format("MMM D YYYY")}`}
            style={{ backgroundColor: primaryColor }}
            subtitleColor={textColor}
            titleColor={textColor}
            children={
              logoImageUrl ? (
                <img src={logoImageUrl} className={css(styles.image)} />
              ) : (
                ""
              )
            }
          />
          <Divider />
          <div style={{ margin: "20px" }}>
            <div dangerouslySetInnerHTML={{ __html: introHtml }} />
          </div>
          {!isWithinTextingHours && (
            <div style={{ margin: "20px", fontStyle: "italic" }}>
              It is outside of texting hours for this campain. Check back at{" "}
              {assignment.campaign.textingHoursStart}:00{" "}
              {assignment.campaign.timezone}
            </div>
          )}
          <CardActions>
            {renderRequestBatchButton ? (
              <RequestBatchButton
                organizationId={organizationId}
                assignmentId={assignment.id}
                buttonLabel={requestBatchButtonLabel}
                unsentCount={unmessagedCount}
                disabled={batchRequestButtonDisabled}
              />
            ) : null}
            {renderConversationsButton
              ? this.renderBadgedButton({
                  dataTestText: "conversations",
                  assignment,
                  title: "Conversations",
                  count: needsResponseCount,
                  primary: false,
                  disabled: false,
                  contactsFilter: "conversations",
                  hideIfZero: false
                })
              : null}
            {/*  TODO: better messaging around texting hours */}
            {this.renderBadgedButton({
              assignment,
              title: "Send Later",
              count: isWithinTextingHours ? 0 : needsResponseCount,
              primary: false,
              disabled: true,
              contactsFilter: null,
              hideIfZero: true
            })}
          </CardActions>
        </Card>
      </div>
    );
  }
}

export default withRouter(AssignmentSummary);
