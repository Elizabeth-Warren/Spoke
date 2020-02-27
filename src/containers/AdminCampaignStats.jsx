import PropTypes from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import { Card, CardTitle, CardText } from "material-ui/Card";
import Snackbar from "material-ui/Snackbar";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import theme from "../styles/theme";
import wrapMutations from "./hoc/wrap-mutations";
import { dataTest } from "../lib/attributes";
import DisplayLink from "src/components/DisplayLink";
import { Dialog } from "material-ui";
import DataTables from "material-ui-datatables";
import LinearProgress from "material-ui/LinearProgress";
import _ from "lodash";
import moment from "moment";
import CampaignStatusModal from "../components/CampaignStatusModal.jsx";
import { CampaignStatus } from "../lib/campaign-statuses";
const { ARCHIVED } = CampaignStatus;

const inlineStyles = {
  stat: {
    margin: "10px 0",
    width: "100%",
    maxWidth: 400
  },
  count: {
    fontSize: "60px",
    paddingTop: "10px",
    textAlign: "center",
    fontWeight: "bold"
  },
  title: {
    textTransform: "uppercase",
    textAlign: "center"
  }
};

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  archivedBanner: {
    backgroundColor: "#FFFBE6",
    fontSize: "16px",
    fontWeight: "bold",
    width: "100%",
    padding: "15px",
    textAlign: "center",
    marginBottom: "20px"
  },

  header: {
    ...theme.text.header
  },
  flexColumn: {
    flex: 1,
    textAlign: "right",
    display: "flex"
  },
  question: {
    marginBottom: 24
  },
  rightAlign: {
    marginLeft: "auto",
    marginRight: 0
  },
  inline: {
    display: "inline-block",
    marginLeft: 20,
    verticalAlign: "middle"
  },
  spacer: {
    marginRight: 20
  },
  secondaryHeader: {
    ...theme.text.secondaryHeader
  },
  progressBar: {
    paddingBottom: "20px"
  }
});

const texterStatColumns = [
  {
    key: "texter",
    label: "Texter",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },
  {
    key: "messagedCount",
    label: "Messaged",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },
  {
    key: "unmessagedCount",
    label: "Not Messaged",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },
  {
    key: "skippedCount",
    label: "Skipped",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },

  {
    key: "contactCount",
    label: "Total Contacts",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  }
];

const Stat = ({ title, count }) => (
  <Card key={title} style={inlineStyles.stat}>
    <CardTitle title={count} titleStyle={inlineStyles.count} />
    <CardText style={inlineStyles.title}>{title}</CardText>
  </Card>
);

Stat.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number
};

class AdminCampaignStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exportMessageOpen: false,
      disableExportButton: false,
      showJoinDialog: false
    };
  }

  openJoinDialog() {
    this.setState({ showJoinDialog: true });
  }

  closeJoinDialog() {
    this.setState({ showJoinDialog: false });
  }

  renderTexterStats() {
    const data = (this.props.data.campaign.assignmentSummaries || []).map(
      summary => ({
        texter: `${summary.texterFirstName} ${summary.texterLastName}`,
        messagedCount: summary.contactCount - summary.unmessagedCount,
        unmessagedCount: summary.unmessagedCount,
        skippedCount: summary.closedCount,
        contactCount: summary.contactCount
      })
    );
    return (
      <DataTables
        data={_.sortBy(data, d => d.texter)}
        columns={texterStatColumns}
        rowSize={data.length}
        count={data.length}
      />
    );
  }

  showCampaignStatusModal = () =>
    this.setState({
      campaignStatusModalOpen: true
    });

  handleCloseModal = () => this.setState({ campaignStatusModalOpen: false });

  handleChangeStatus = (event, index, newCampaignStatus) => {
    this.setState({
      newCampaignStatus
    });
  };

  handleSave = async () => {
    const { campaignId, organizationId } = this.props.params;
    const { newCampaignStatus } = this.state;

    if (newCampaignStatus === ARCHIVED) {
      await this.props.mutations.archiveCampaign(campaignId);
      this.props.router.push(`/admin/${organizationId}/campaigns`);
    } else {
      await this.props.mutations.updateCampaignStatus(
        campaignId,
        newCampaignStatus
      );
    }
    this.handleCloseModal();
  };

  render() {
    const { data, params } = this.props;
    const { organizationId, campaignId } = params;
    const campaign = data.campaign;
    const { status } = campaign;
    const { adminPerms } = this.props.params;

    // TODO[fuzzy]: load from new jobs API right now it
    // won't give feedback on job progress)
    const currentExportJob = null;
    const shouldDisableExport =
      this.state.disableExportButton || currentExportJob;

    const exportLabel = currentExportJob
      ? `Exporting (${currentExportJob.status}%)`
      : "Export Data";

    const showInviteLink =
      !campaign.isArchived && campaign.useDynamicAssignment;
    // TODO: clean up the stats resolver to pull contact stats in one query rather
    //  than summing up texter stats here in the frontent, should be the same query
    //  as campaign.contactsCount.
    //  This under-counts skipped _with_ a reply.
    let distinctContactsMessaged = 0;
    let distinctContactsWithReplies = 0;
    let skippedContacts = 0;
    this.props.data.campaign.assignmentSummaries.forEach(summary => {
      distinctContactsMessaged +=
        summary.contactCount - summary.unmessagedCount;
      distinctContactsWithReplies +=
        summary.convoCount + summary.needsResponseCount;
      skippedContacts += summary.closedCount;
    });

    const replyRate =
      ((distinctContactsWithReplies - campaign.stats.optOutsCount) /
        distinctContactsMessaged) *
      100;
    return (
      <div>
        {!!this.state.campaignStatusModalOpen && (
          <CampaignStatusModal
            campaignIdForStatusChange={campaign.id}
            campaignStatus={this.state.newCampaignStatus}
            handleCloseModal={this.handleCloseModal}
            handleSave={this.handleSave}
            handleChangeStatus={this.handleChangeStatus}
          />
        )}
        <div className={css(styles.container)}>
          {campaign.isArchived ? (
            <div className={css(styles.archivedBanner)}>
              This campaign is archived
            </div>
          ) : (
            ""
          )}

          <div className={css(styles.header)}>
            {campaign.title}
            <br />
            Campaign ID: {campaign.id}
            <br />
            Due By: {moment(campaign.dueBy).format("MMM D, YYYY")}
          </div>
          <div className={css(styles.flexColumn)}>
            <div className={css(styles.rightAlign)}>
              <div className={css(styles.inline)}>
                <div className={css(styles.inline)}>
                  {showInviteLink ? (
                    <RaisedButton
                      {...dataTest("inviteLink")}
                      onClick={() => this.openJoinDialog()}
                      label="Invite"
                    />
                  ) : (
                    ""
                  )}
                  {!campaign.isArchived ? (
                    // edit
                    <RaisedButton
                      {...dataTest("editCampaign")}
                      onClick={() =>
                        this.props.router.push(
                          `/admin/${organizationId}/campaigns/${campaignId}/edit`
                        )
                      }
                      label="Edit"
                    />
                  ) : null}
                  <RaisedButton
                    onClick={() =>
                      this.props.router.push(
                        `/admin/${organizationId}/campaigns/${campaignId}/review`
                      )
                    }
                    label="Message Review"
                  />
                  {adminPerms
                    ? [
                        // Buttons for Admins (and not Supervolunteers)
                        // export
                        <RaisedButton
                          onClick={async () => {
                            this.setState(
                              {
                                exportMessageOpen: true,
                                disableExportButton: true
                              },
                              () => {
                                this.setState({
                                  exportMessageOpen: true,
                                  disableExportButton: false
                                });
                              }
                            );
                            await this.props.mutations.exportCampaign(
                              campaignId
                            );
                          }}
                          label={exportLabel}
                          disabled={shouldDisableExport}
                        />,
                        !campaign.isArchived ? (
                          <RaisedButton
                            onClick={this.showCampaignStatusModal}
                            label="Update Status"
                          />
                        ) : null, // copy
                        <RaisedButton
                          {...dataTest("copyCampaign")}
                          label="Copy Campaign"
                          onClick={async () => {
                            this.props.router.push(
                              `/admin/${organizationId}/campaigns/new?copy=${this.props.params.campaignId}`
                            );
                          }}
                        />
                      ]
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={css(styles.container)}>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Texters" count={campaign.assignmentSummaries.length} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Contacts" count={campaign.contactsCount} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Messaged" count={distinctContactsMessaged} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Replied" count={distinctContactsWithReplies} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Skipped" count={skippedContacts} />
          </div>
          <div className={css(styles.flexColumn, styles.spacer)}>
            <Stat title="Opt-outs" count={campaign.stats.optOutsCount} />
          </div>
          <div className={css(styles.flexColumn)}>
            <Stat
              title="Reply Rate (%)"
              count={distinctContactsMessaged ? _.round(replyRate, 1) : "-"}
            />
          </div>
        </div>
        <div className={css(styles.progressBar)}>
          <LinearProgress
            mode={"determinate"}
            color={theme.colors.EWlibertyGreen}
            // Add style to make it thicker style={}
            value={distinctContactsMessaged}
            max={campaign.contactsCount}
            min={0}
          />
        </div>
        <div className={css(styles.header)}>Texter stats</div>
        {this.renderTexterStats()}
        <Snackbar
          open={this.state.exportMessageOpen}
          message="Export started - we'll e-mail you when it's done"
          autoHideDuration={5000}
          onRequestClose={() => {
            this.setState({ exportMessageOpen: false });
          }}
        />
        <Dialog
          title="Invite texters to this campaign"
          modal={false}
          open={this.state.showJoinDialog}
          onRequestClose={() => this.closeJoinDialog()}
          onBackdropClick={() => this.closeJoinDialog()}
          onEscapeKeyDown={() => this.closeJoinDialog()}
        >
          <DisplayLink url={campaign.joinUrl} textContent={"Share this link"} />
        </Dialog>
      </div>
    );
  }
}

AdminCampaignStats.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object,
  params: PropTypes.object,
  router: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          isArchived
          useDynamicAssignment
          dueBy
          status
          assignmentSummaries {
            assignmentId
            texterId
            texterFirstName
            texterLastName
            unmessagedCount
            unmessagedCount
            needsResponseCount
            convoCount
            closedCount
            contactCount
          }
          contactsCount
          stats {
            optOutsCount
          }
          joinUrl
        }
      }
    `,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    pollInterval: 5000
  }
});

const mapMutationsToProps = () => ({
  archiveCampaign: campaignId => ({
    mutation: gql`
      mutation archiveCampaign($campaignId: String!) {
        archiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  exportCampaign: campaignId => ({
    mutation: gql`
      mutation exportCampaign($campaignId: String!) {
        exportCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
  }),

  updateCampaignStatus: (campaignId, status) => ({
    mutation: gql`
      mutation updateCampaignStatus(
        $campaignId: ID!
        $status: CampaignStatus!
      ) {
        updateCampaignStatus(id: $campaignId, status: $status) {
          id
          status
        }
      }
    `,
    variables: { campaignId, status }
  })
});

export default loadData(withRouter(wrapMutations(AdminCampaignStats)), {
  mapQueriesToProps,
  mapMutationsToProps
});
