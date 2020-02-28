import React from "react";
import gql from "graphql-tag";
import SpeakerNotesIcon from "material-ui/svg-icons/action/speaker-notes";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import loadData from "../hoc/load-data";
import wrapMutations from "../hoc/wrap-mutations";
import Empty from "../../components/Empty";
import Campaign from "./Campaign";
import PaginatedList from "../../components/Paginated/PaginatedList";
import LoadingIndicator from "../../components/LoadingIndicator";
import theme from "../../styles/theme";
import CampaignStatusModal from "../../components/CampaignStatusModal";
import { CampaignStatus } from "../../lib/campaign-statuses";
import ConfirmCampaignArchiveModal from "../../components/ConfirmCampaignArchiveModal.jsx";

const { ARCHIVED } = CampaignStatus;

const styles = {
  dialog: {
    width: "50%"
  },
  iconStyle: { marginRight: 5, height: 18 },
  statusInfoStyle: {
    display: "flex",
    marginBottom: 40,
    fontSize: 13,
    alignItems: "center"
  },
  archiveConfirmation: {
    width: "100%",
    backgroundColor: theme.colors.veryLightGray,
    borderRadius: 6,
    padding: "20px 20px 10px 20px",
    boxSizing: "border-box"
  },
  archiveConfirmHeader: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 0,
    textAlign: "center",
    fontWeight: "bold",
    color: theme.colors.EWnavy
  },
  archiveConfirmContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  largeWarningIcon: { height: 75, width: 75, marginRight: 20 }
};

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  dueBy
  status
  creator {
    displayName
  }
`;

let ROW_SIZES = [50, 10, 25, 100];
const INITIAL_ROW_SIZE = ROW_SIZES[0];
ROW_SIZES.sort((a, b) => a - b);

export class CampaignList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      pageSize: INITIAL_ROW_SIZE,
      campaignIdForStatusChange: null
    };
  }

  changePage = (pageDelta, pageSize) => {
    const {
      limit,
      offset,
      total
    } = this.props.data.organization.campaigns.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const pageSizeAdjustedCurrentPage = Math.floor(
      (currentPage * limit) / pageSize
    );
    const maxPage = Math.floor(total / pageSize);
    const newPage = Math.min(maxPage, pageSizeAdjustedCurrentPage + pageDelta);
    this.props.data.fetchMore({
      variables: {
        cursor: {
          offset: newPage * pageSize,
          limit: pageSize
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        const returnValue = {
          organization: {
            campaigns: {
              campaigns: []
            }
          }
        };

        if (fetchMoreResult) {
          returnValue.organization = fetchMoreResult.organization;
        }
        return returnValue;
      }
    });
    this.setState({
      cursor: {
        offset: newPage * pageSize,
        limit: pageSize
      }
    });
  };
  handleNextPageClick = () => {
    this.changePage(1, this.state.pageSize);
  };

  handlePreviousPageClick = () => {
    this.changePage(-1, this.state.pageSize);
  };

  handleRowSizeChanged = (index, value) => {
    this.changePage(0, value);
    this.setState({ pageSize: value });
  };

  handleArchiveCampaign = async () => {
    await this.props.mutations.archiveCampaign(this.state.campaignIdToArchive);
  };

  showArchiveConfirmModal = campaignId => {
    this.setState({ campaignIdToArchive: campaignId });
  };

  renderRow = campaign => (
    <Campaign
      campaign={campaign}
      adminPerms={this.props.adminPerms}
      selectMultiple={this.props.selectMultiple}
      router={this.props.router}
      handleChecked={this.props.handleChecked}
      organizationId={this.props.organizationId}
      archiveCampaign={this.handleArchiveCampaign}
      onClickCampaignStatusIcon={
        campaign.status === "NOT_STARTED"
          ? this.showArchiveConfirmModal
          : this.showCampaignStatusModal
      }
    />
  );

  showCampaignStatusModal = (campaignId, campaignStatus) =>
    this.setState({
      campaignIdForStatusChange: campaignId,
      campaignStatus
    });

  handleCloseModal = () => this.setState({ campaignIdForStatusChange: null });

  handleChangeStatus = (event, index, campaignStatus) => {
    this.setState({
      campaignStatus
    });
  };

  handleSave = async () => {
    const { campaignIdForStatusChange, campaignStatus } = this.state;
    if (campaignStatus === ARCHIVED) {
      await this.props.mutations.archiveCampaign(campaignIdForStatusChange);
    } else {
      await this.props.mutations.updateCampaignStatus(
        campaignIdForStatusChange,
        campaignStatus
      );
    }
    this.handleCloseModal();
  };

  render() {
    if (this.props.data.loading || !this.props.data.organization) {
      return <LoadingIndicator />;
    }
    const { campaigns, pageInfo } = this.props.data.organization.campaigns;
    const { limit, offset, total } = pageInfo;
    const displayPage = Math.floor(offset / limit) + 1;

    return campaigns.length === 0 ? (
      <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />
    ) : (
      <div>
        <ConfirmCampaignArchiveModal
          open={!!this.state.campaignIdToArchive}
          onClose={() => this.setState({ campaignIdToArchive: null })}
          onHandleArchive={this.handleArchiveCampaign}
        />
        <PaginatedList
          rowSizeList={ROW_SIZES}
          page={displayPage}
          rowSize={this.state.pageSize}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
        >
          {campaigns.map(campaign => this.renderRow(campaign))}
        </PaginatedList>
        {!!this.state.campaignIdForStatusChange && (
          <CampaignStatusModal
            campaignIdForStatusChange={this.state.campaignIdForStatusChange}
            campaignStatus={this.state.campaignStatus}
            handleCloseModal={this.handleCloseModal}
            handleSave={this.handleSave}
            handleChangeStatus={this.handleChangeStatus}
          />
        )}
      </div>
    );
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      dueBy: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string
    })
  ),
  router: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  organizationId: PropTypes.string,
  data: PropTypes.object,
  mutations: PropTypes.object,
  handleChecked: PropTypes.func,
  campaignsFilter: PropTypes.object,
  sortBy: PropTypes.string
};

const mapMutationsToProps = () => ({
  archiveCampaign: campaignId => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId },
    refetchQueries: ["organization"]
  }),
  updateCampaignStatus: (campaignId, status) => ({
    mutation: gql`mutation updateCampaignStatus($campaignId: ID!, $status: CampaignStatus!) {
        updateCampaignStatus(id: $campaignId, status: $status) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId, status }
  })
});

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $campaignsFilter: CampaignsFilter, $cursor: OffsetLimitCursor, $sortBy: SortCampaignsBy) {
      organization(id: $organizationId) {
        id
        campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
          ... on PaginatedCampaigns{
              pageInfo {
                offset
                limit
                total
              }
              campaigns{
                ${campaignInfoFragment}
              }
            }
          }
        }
      }
    `,
    variables: {
      cursor: { offset: 0, limit: INITIAL_ROW_SIZE },
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      sortBy: ownProps.sortBy
    },
    fetchPolicy: "network-only"
  }
});

export default loadData(wrapMutations(withRouter(CampaignList)), {
  mapQueriesToProps,
  mapMutationsToProps
});
