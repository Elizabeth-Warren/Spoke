import PropTypes from "prop-types";
import gql from "graphql-tag";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import loadData from "../../containers/hoc/load-data";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { List, ListItem } from "material-ui/List";
import moment from "moment";
import Theme from "../../styles/theme";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column"
  }
});

class TagsDialog extends React.Component {
  dialogActions = (
    <FlatButton label="Close" primary onClick={this.props.closeRequested} />
  );

  render = () => {
    return (
      this.props.open && (
        <Dialog title="Tags" open actions={this.dialogActions} modal>
          <div className={css(styles.container)}>
            <List>
              {this.props.conversations.conversations.conversations[0].contact.tags.map(
                (tag, index) => (
                  <ListItem key={index}>
                    <span style={Theme.text.body}>{`${tag.tag} `}</span>
                    <span
                      style={Object.assign({}, Theme.text.body, {
                        fontSize: Theme.text.body.fontSize * 0.8,
                        fontStyle: "italic"
                      })}
                    >
                      {`${moment(tag.createdAt).format("lll")}`}
                    </span>
                  </ListItem>
                )
              )}
            </List>
          </div>
        </Dialog>
      )
    );
  };
}

TagsDialog.propTypes = {
  open: PropTypes.bool,
  closeRequested: PropTypes.func,
  campaign: PropTypes.object,
  campaignContact: PropTypes.object,
  assignment: PropTypes.object,
  conversations: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $cursor: OffsetLimitCursor!
        $contactsFilter: ContactsFilter
        $assignmentsFilter: AssignmentsFilter
      ) {
        conversations(
          cursor: $cursor
          organizationId: $organizationId
          contactsFilter: $contactsFilter
          assignmentsFilter: $assignmentsFilter
        ) {
          pageInfo {
            limit
            offset
            total
          }
          conversations {
            contact {
              tags {
                tag
                createdAt
                createdBy {
                  displayName
                }
                resolvedAt
                resolvedBy {
                  displayName
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.campaign.organization.id,
      cursor: { offset: 0, limit: 1 },
      contactsFilter: { contactId: ownProps.campaignContact.id },
      assignmentsFilter: { texterId: ownProps.assignment.texter.id }
    },
    forceFetch: true
  }
});

export default loadData(TagsDialog, { mapQueriesToProps });
