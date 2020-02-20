import types from "prop-types";
import React, { Component } from "react";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import { StyleSheet, css } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";
import Badge from "material-ui/Badge";
import moment from "moment";
import Divider from "material-ui/Divider";
import { withRouter } from "react-router";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import RequestBatchButton from "src/containers/RequestBatchButton";
import { getBlackOrWhiteTextForBg } from "../lib/color-helpers";

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
    isWithinTextingHours: types.bool,
    unmessagedCount: types.number,
    conversationCount: types.number,
    needsResponseCount: types.number
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
    const {
      assignment,
      unmessagedCount,
      conversationCount,
      isWithinTextingHours,
      organizationId,
      needsResponseCount
    } = this.props;
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
    const textColor =
      (primaryColor && getBlackOrWhiteTextForBg(primaryColor)) || null;
    // TODO: style summaries based on campaign status.
    //  In particular, if a campaign is CLOSED_FOR_INITIAL_SENDS and there are
    //  no conversations, or if a campaign is CLOSED_FOR_ALL_SENDS, the card
    //  will have no buttons

    const renderRequestBatchButton =
      status === "ACTIVE" &&
      isWithinTextingHours &&
      (unmessagedCount > 0 ||
        (useDynamicAssignment &&
          hasUnassignedContactsForTexter &&
          !needsResponseCount));

    const renderConversationsButton =
      (status === "ACTIVE" || status === "CLOSED_FOR_INITIAL_SENDS") &&
      isWithinTextingHours &&
      conversationCount > 0;

    return (
      <div className={css(styles.container)}>
        <Card key={assignment.id}>
          <CardTitle
            title={title}
            subtitle={`${description} - ${moment(dueBy).format("MMM D YYYY")}`}
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
          <CardActions>
            {renderRequestBatchButton ? (
              <RequestBatchButton
                organizationId={organizationId}
                assignmentId={assignment.id}
                buttonLabel={
                  unmessagedCount ? "Finish Text Batch" : "Send Initial Texts"
                }
                unsentCount={unmessagedCount}
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
              count: isWithinTextingHours ? 0 : unmessagedCount,
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
