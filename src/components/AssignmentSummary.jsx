import PropTypes from "prop-types";
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
  state = {
    badTimezoneTooltipOpen: false
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
      skippedMessagesCount,
      // TODO: simplify this, because we don't use per-contact location data we can just
      //  disable stuff by checking the campaign texting hours
      badTimezoneCount,
      organizationId
    } = this.props;
    const {
      title,
      description,
      hasUnassignedContactsForTexter,
      dueBy,
      primaryColor,
      logoImageUrl,
      introHtml,
      useDynamicAssignment
    } = assignment.campaign;
    const maxContacts = assignment.maxContacts;
    return (
      <div className={css(styles.container)}>
        <Card key={assignment.id}>
          <CardTitle
            title={title}
            subtitle={`${description} - ${moment(dueBy).format("MMM D YYYY")}`}
            style={{ backgroundColor: primaryColor }}
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
            {unmessagedCount > 0 ||
            (useDynamicAssignment &&
              badTimezoneCount === 0 &&
              hasUnassignedContactsForTexter) ? (
              <RequestBatchButton
                organizationId={organizationId}
                assignmentId={assignment.id}
                buttonLabel="Send Initial Texts"
                unsentCount={unmessagedCount}
              />
            ) : null}
            {this.renderBadgedButton({
              dataTestText: "conversations",
              assignment,
              title: "Conversations",
              count: conversationCount + skippedMessagesCount,
              primary: false,
              disabled: false,
              contactsFilter: "conversations", // TODO: introduce our own filter
              hideIfZero: true
            })}
            {/*  TODO: better messaging around texting hours */}
            {this.renderBadgedButton({
              assignment,
              title: "Send later",
              count: badTimezoneCount,
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

AssignmentSummary.propTypes = {
  organizationId: PropTypes.string,
  router: PropTypes.object,
  assignment: PropTypes.object,
  unmessagedCount: PropTypes.number,
  conversationCount: PropTypes.number,
  badTimezoneCount: PropTypes.number,
  skippedMessagesCount: PropTypes.number,
  data: PropTypes.object,
  mutations: PropTypes.object
};

export default withRouter(AssignmentSummary);
