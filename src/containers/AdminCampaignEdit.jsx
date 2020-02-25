import PropTypes from "prop-types";
import React from "react";
import _ from "lodash";
import { withRouter } from "react-router";

import { Dialog } from "material-ui";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import DoneIcon from "material-ui/svg-icons/action/done";
import Avatar from "material-ui/Avatar";
import theme from "../styles/theme";
import { Card, CardHeader, CardText } from "material-ui/Card";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import wrapMutations from "./hoc/wrap-mutations";
import RaisedButton from "material-ui/RaisedButton";
import CampaignBasicsForm from "../components/CampaignBasicsForm";
import CampaignContactsForm from "../components/CampaignContactsForm";
import CampaignPhoneNumbersForm from "../components/CampaignPhoneNumbersForm";
import CampaignInteractionStepsForm from "../components/CampaignInteractionStepsForm";
import CampaignCannedResponsesForm from "../components/CampaignCannedResponsesForm";
import { dataTest, camelCase } from "../lib/attributes";
import CampaignTextingHoursForm from "../components/CampaignTextingHoursForm";
import ShiftingConfigurationForm from "src/components/ShiftingConfigurationForm";
import DisplayLink from "src/components/DisplayLink";
import { CreateContainer } from "./AdminCampaignCreate";
import JobProgress from "./JobProgress";
import { validateCustomFieldsInBody } from "../lib/custom-fields-helpers";

const campaignInfoFragment = `
  id
  title
  description
  dueBy
  isStarted
  isArchived
  contactsCount
  contactsPreview {
    firstName
    lastName
    cell
    external_id
    external_id_type
    state_code
    customFields
  }
  datawarehouseAvailable
  customFields
  useDynamicAssignment
  logoImageUrl
  introHtml
  primaryColor
  overrideOrganizationTextingHours
  textingHoursEnforced
  textingHoursStart
  textingHoursEnd
  timezone
  shiftingConfiguration
  joinUrl
  phoneNumbers {
    areaCode
    count
    reservedAt
  }
  interactionSteps {
    id
    questionText
    script
    answerOption
    answerActions
    parentInteractionId
    isDeleted
  }
  cannedResponses {
    id
    title
    text
    surveyQuestion
    deleted
  }
  editors
  contactFileName
  contactImportJob {
    id
    resultMessage
    progress
    status
  }
  startJob {
    id
    resultMessage
    progress
    status
  }
`;

class AdminCampaignEdit extends React.Component {
  constructor(props) {
    super(props);
    const isNew = props.location.query.new;
    this.state = {
      expandedSection: isNew ? 0 : null,
      campaignFormValues: {
        ...props.campaignData.campaign
      },
      showJoinDialog: false
    };
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    // This should only update the campaignFormValues sections that
    // are NOT expanded so the form data doesn't compete with the user
    // The basic flow of data:
    // 1. User adds data to a section -> this.state.campaignFormValues
    // 2. User saves -> (handleSave) mutations.editCampaign ->
    // 3. Refetch/poll updates data in loadData component wrapper
    //    and triggers *this* method => this.props.campaignData => this.state.campaignFormValues
    // So campaignFormValues should always be the diffs between server and client form data
    let { expandedSection } = this.state;
    let expandedKeys = [];
    if (expandedSection !== null) {
      expandedSection = this.sections()[expandedSection];
      expandedKeys = expandedSection.keys;
    }

    const campaignDataCopy = {
      ...newProps.campaignData.campaign
    };
    expandedKeys.forEach(key => {
      // contactsCount is in two sections
      // That means it won't get updated if *either* is opened
      // but we want it to update in either
      if (key === "contactsCount") {
        return;
      }
      delete campaignDataCopy[key];
    });
    // NOTE: Since this does not _deep_ copy the values the
    // expandedKey pointers will remain the same object as before
    // so setState passes on those subsections should1 not refresh
    const pushToFormValues = {
      ...this.state.campaignFormValues,
      ...campaignDataCopy
    };

    this.setState({
      campaignFormValues: pushToFormValues
    });
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state;

    if (newExpandedState) {
      this.setState({ expandedSection: index });
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null });
    }
  };

  getSectionState(section) {
    const sectionState = {};
    section.keys.forEach(key => {
      sectionState[key] = this.state.campaignFormValues[key];
    });
    return sectionState;
  }

  isNew() {
    return this.props.location.query.new;
  }

  handleChange = formValues => {
    this.setState({
      campaignFormValues: {
        ...this.state.campaignFormValues,
        ...formValues
      }
    });
  };

  handleSubmit = async () => {
    if (!this.state.expandedSection.doNotSaveAfterSubmit) {
      await this.handleSave();
    }

    this.setState({
      expandedSection:
        this.state.expandedSection >= this.sections().length - 1 ||
        !this.isNew()
          ? null
          : this.state.expandedSection + 1
    });
  };

  handleSave = async () => {
    // only save the current expanded section
    const { expandedSection } = this.state;
    if (expandedSection === null) {
      return;
    }

    const section = this.sections()[expandedSection];
    let newCampaign = {};
    if (this.checkSectionSaved(section)) {
      return; // already saved and no data changes
    }

    newCampaign = {
      ...this.getSectionState(section)
    };

    if (Object.keys(newCampaign).length > 0) {
      // Transform the campaign into an input understood by the server
      delete newCampaign.customFields;
      delete newCampaign.contactsCount;
      if (newCampaign.hasOwnProperty("interactionSteps")) {
        newCampaign.interactionSteps = _.omit(
          newCampaign.interactionSteps,
          "__typename"
        );
      }
      if (newCampaign.hasOwnProperty("cannedResponses")) {
        newCampaign.cannedResponses = newCampaign.cannedResponses.map(cr =>
          _.omit(cr, "__typename")
        );
      }
      if (newCampaign.hasOwnProperty("phoneNumbers")) {
        newCampaign.phoneNumbers = newCampaign.phoneNumbers.map(cr =>
          _.omit(cr, "__typename")
        );
      }
      await this.props.mutations.editCampaign(
        this.props.campaignData.campaign.id,
        newCampaign
      );
    }
  };

  openJoinDialog() {
    this.setState({ showJoinDialog: true });
  }

  closeJoinDialog() {
    this.setState({ showJoinDialog: false });
  }

  checkSectionSaved(section) {
    // Tests section's keys of campaignFormValues against props.campaignData
    // * Determines greyness of section button
    // * Determine if section is marked done (in green) along with checkSectionCompleted()
    // * Must be false for a section to save!!
    // Only Contacts section implements checkSaved()
    if (section.hasOwnProperty("checkSaved")) {
      return section.checkSaved();
    }
    const sectionState = {};
    const sectionProps = {};
    section.keys.forEach(key => {
      sectionState[key] = this.state.campaignFormValues[key];
      sectionProps[key] = this.props.campaignData.campaign[key];
    });
    // console.log(
    //   "CHECK SAVED section state:",
    //   sectionState,
    //   "section props",
    //   sectionProps
    // );
    return JSON.stringify(sectionState) === JSON.stringify(sectionProps);
  }

  checkSectionCompleted(section) {
    return section.checkCompleted();
  }

  getMissingCustomFields = responses => {
    const { customFields } = this.props.campaignData.campaign;
    const { cannedResponses } = this.state.campaignFormValues;
    const activeResponses = cannedResponses.filter(
      response => !response.deleted
    );
    const missingFields = activeResponses.reduce((acc, response) => {
      const { missingFields = [] } = validateCustomFieldsInBody(
        response.text,
        customFields
      );
      return [...acc, ...missingFields];
    }, []);

    const invalidCustomFields = _.union(missingFields);
    return invalidCustomFields;
  };

  sections() {
    return [
      {
        title: "Basics",
        content: CampaignBasicsForm,
        keys: [
          "title",
          "description",
          "dueBy",
          "logoImageUrl",
          "primaryColor",
          "introHtml"
        ],
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        checkCompleted: () =>
          this.state.campaignFormValues.title !== "" &&
          this.state.campaignFormValues.description !== "" &&
          this.state.campaignFormValues.dueBy !== null
      },
      {
        title: "Contacts",
        content: CampaignContactsForm,
        keys: [
          "contactsPreview",
          "contactsCount",
          "customFields",
          "contactSql",
          "contactFileName"
        ],
        checkCompleted: () => this.state.campaignFormValues.contactsCount > 0,
        checkSaved: () =>
          // Must be false for save to be tried
          // Must be true for green bar, etc.
          // This is a little awkward because neither of these fields are 'updated'
          //   from the campaignData query, so we must delete them after save/update
          //   at the right moment (see UNSAFE_componentWillReceiveProps)
          this.state.campaignFormValues.contactsCount > 0,
        blocksStarting: true,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: false,
        extraProps: {
          optOuts: [], // this.props.organizationData.organization.optOuts, // <= doesn't scale,
          datawarehouseAvailable: this.props.campaignData.campaign
            .datawarehouseAvailable
        }
      },
      {
        title: "Initial Outbound",
        content: CampaignInteractionStepsForm,
        keys: ["interactionSteps"],
        checkCompleted: () =>
          this.state.campaignFormValues.interactionSteps[0] &&
          this.state.campaignFormValues.interactionSteps.some(
            step => step.script
          ),
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields,
          availableActions: this.props.availableActionsData.availableActions
        }
      },
      {
        title: "Script Responses",
        content: CampaignCannedResponsesForm,
        keys: ["cannedResponses"],
        checkCompleted: () => {
          const invalidFields = this.getMissingCustomFields();
          const noUnsaved = !_.some(
            this.state.campaignFormValues.cannedResponses,
            cr => cr.isNew
          );
          return noUnsaved && !invalidFields.length;
        },
        blocksStarting: true,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: true,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields,
          getMissingCustomFields: this.getMissingCustomFields
        }
      },
      {
        title: "Texting Hours",
        content: CampaignTextingHoursForm,
        keys: [
          "overrideOrganizationTextingHours",
          "textingHoursEnforced",
          "textingHoursStart",
          "textingHoursEnd",
          "timezone"
        ],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false
      },
      {
        title: "Shifting Configuration",
        content: ShiftingConfigurationForm,
        keys: ["shiftingConfiguration"],
        checkCompleted: () => true,
        blocksStarting: false,
        expandAfterCampaignStarts: true,
        expandableBySuperVolunteers: false,
        extraProps: {
          customFields: this.props.campaignData.campaign.customFields
        }
      },
      {
        title: "Phone Numbers",
        content: CampaignPhoneNumbersForm,
        keys: ["phoneNumbers"],
        checkCompleted: () => {
          if (
            !this.props.organizationData.organization
              .campaignPhoneNumbersEnabled
          ) {
            return true;
          }
          const {
            contactsCount,
            phoneNumbers
          } = this.props.campaignData.campaign;
          const numbersNeeded = Math.ceil(
            contactsCount / window.CONTACTS_PER_PHONE_NUMBER
          );
          const numbersReserved = (phoneNumbers || []).reduce(
            (acc, entry) => acc + entry.count,
            0
          );
          return numbersReserved >= numbersNeeded;
        },
        hidden: !this.props.organizationData.organization
          .campaignPhoneNumbersEnabled,
        blocksStarting: true,
        expandAfterCampaignStarts: false,
        expandableBySuperVolunteers: true,
        extraProps: {
          availablePhoneNumbers: this.props.organizationData.organization
            .availablePhoneNumbers,
          contactsCount: this.state.campaignFormValues.contactsCount
        }
      }
    ];
  }

  renderCurrentEditors() {
    const { editors } = this.props.campaignData.campaign;
    if (editors) {
      return <div>This campaign is being edited by: {editors}</div>;
    }
    return "";
  }

  renderCampaignFormSection(section, isLast) {
    let shouldDisable = !this.isNew() && this.checkSectionSaved(section);
    const ContentComponent = section.content;
    const formValues = this.getSectionState(section);
    return (
      <ContentComponent
        onChange={this.handleChange}
        formValues={formValues}
        saveLabel={
          this.isNew() && !isLast ? "Save and goto next section" : "Save"
        }
        saveDisabled={shouldDisable}
        ensureComplete={this.props.campaignData.campaign.isStarted}
        onSubmit={this.handleSubmit}
        {...section.extraProps}
      />
    );
  }

  renderHeader() {
    return (
      <div
        style={{
          marginBottom: 15,
          fontSize: 16
        }}
      >
        {this.props.campaignData.campaign.isStarted
          ? this.renderStartedCampaignHeader()
          : this.renderUnstartedCampaignHeader()}
      </div>
    );
  }

  async handleStartCampaign() {
    await this.props.mutations.startCampaign(
      this.props.campaignData.campaign.id
    );
  }

  renderStartedCampaignHeader() {
    const useStaticAssign = !this.props.campaignData.campaign
      .useDynamicAssignment;
    return (
      <div style={{ ...theme.layouts.multiColumn.container }}>
        <div
          {...dataTest("campaignIsStarted")}
          style={{
            color: theme.colors.EWnavy,
            ...theme.layouts.multiColumn.flexColumn
          }}
        >
          <b>{this.props.campaignData.campaign.title}</b>
          This campaign is running!
          {this.renderCurrentEditors()}
        </div>
        {useStaticAssign ? (
          "WARNING: Static Assignment is no longer supported."
        ) : (
          <div
            style={{
              marginLeft: "auto",
              marginRight: 0
            }}
          >
            <RaisedButton
              {...dataTest("inviteLink")}
              onClick={() => this.openJoinDialog()}
              label="Invite"
            />
            <RaisedButton
              onClick={() =>
                this.props.router.push(
                  `/admin/${this.props.params.organizationId}/campaigns/${this.props.params.campaignId}`
                )
              }
              label="Back To Campaign"
            />
          </div>
        )}
      </div>
    );
  }
  renderUnstartedCampaignHeader() {
    if (!this.props.params.adminPerms) {
      // Supervolunteers don't have access to start the campaign or un/archive it
      return null;
    }
    let isCompleted = true;
    this.sections().forEach(section => {
      if (
        (section.blocksStarting && !this.checkSectionCompleted(section)) ||
        !this.checkSectionSaved(section)
      ) {
        isCompleted = false;
      }
    });

    return (
      <div style={{ ...theme.layouts.multiColumn.container }}>
        <div
          style={{
            color: theme.colors.EWnavy,
            ...theme.layouts.multiColumn.flexColumn
          }}
        >
          <b>{this.props.campaignData.campaign.title}</b>
          {isCompleted
            ? "Your campaign is good to go!"
            : "You need to complete all the sections below before you can start this campaign"}
          {this.renderCurrentEditors()}
        </div>
        <div>
          {this.props.campaignData.campaign.isArchived ? (
            <RaisedButton
              label="Unarchive"
              onClick={async () =>
                await this.props.mutations.unarchiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          ) : (
            <RaisedButton
              label="Archive"
              onClick={async () =>
                await this.props.mutations.archiveCampaign(
                  this.props.campaignData.campaign.id
                )
              }
            />
          )}
          <RaisedButton
            {...dataTest("startCampaign")}
            primary
            label="Start This Campaign!"
            disabled={!isCompleted}
            onClick={async () => isCompleted && this.handleStartCampaign()}
          />
        </div>
      </div>
    );
  }

  render() {
    const sections = this.sections().filter(s => !s.hidden);
    const { expandedSection } = this.state;
    const { adminPerms } = this.props.params;
    return (
      <div>
        {this.renderHeader()}
        {sections.map((section, sectionIndex) => {
          const sectionIsDone =
            this.checkSectionCompleted(section) &&
            this.checkSectionSaved(section);
          const sectionIsExpanded = sectionIndex === expandedSection;
          let avatar = null;
          const cardHeaderStyle = {
            backgroundColor: theme.colors.lightGray
          };
          const avatarStyle = {
            display: "inline-block",
            verticalAlign: "middle"
          };

          const isLast = sectionIndex + 1 === sections.length;

          const sectionCanExpandOrCollapse =
            (section.expandAfterCampaignStarts ||
              !this.props.campaignData.campaign.isStarted) &&
            (adminPerms || section.expandableBySuperVolunteers);

          if (sectionIsExpanded && sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.EWlightLibertyGreen;
          } else if (!sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.lightGray;
          } else if (sectionIsDone) {
            avatar = (
              <Avatar
                icon={<DoneIcon style={{ fill: theme.colors.EWnavy }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor = theme.colors.EWlibertyGreen;
          } else if (!sectionIsDone) {
            avatar = (
              <Avatar
                icon={<WarningIcon style={{ fill: theme.colors.EWred }} />}
                style={avatarStyle}
                size={25}
              />
            );
            cardHeaderStyle.backgroundColor = theme.colors.EWlibertyGreen;
          }
          return (
            <Card
              {...dataTest(camelCase(`${section.title}`))}
              key={section.title}
              expanded={sectionIsExpanded && sectionCanExpandOrCollapse}
              expandable={sectionCanExpandOrCollapse}
              onExpandChange={newExpandedState =>
                this.onExpandChange(sectionIndex, newExpandedState)
              }
              style={{
                marginTop: 1
              }}
            >
              <CardHeader
                title={section.title}
                titleStyle={{
                  width: "100%"
                }}
                style={cardHeaderStyle}
                actAsExpander={sectionCanExpandOrCollapse}
                showExpandableButton={sectionCanExpandOrCollapse}
                avatar={avatar}
              />
              <CardText expandable>
                {this.renderCampaignFormSection(section, isLast)}
              </CardText>
            </Card>
          );
        })}
        <Dialog
          title="Invite texters to this campaign"
          modal={false}
          open={this.state.showJoinDialog}
          onRequestClose={() => this.closeJoinDialog()}
          onBackdropClick={() => this.closeJoinDialog()}
          onEscapeKeyDown={() => this.closeJoinDialog()}
        >
          <DisplayLink
            url={this.props.campaignData.campaign.joinUrl}
            textContent={"Share this link"}
          />
        </Dialog>
      </div>
    );
  }
}

AdminCampaignEdit.propTypes = {
  campaignData: PropTypes.object,
  mutations: PropTypes.object,
  organizationData: PropTypes.object,
  params: PropTypes.object,
  location: PropTypes.object,
  availableActionsData: PropTypes.object,
  router: PropTypes.object
};
const mapQueriesToProps = ({ ownProps }) => ({
  campaignData: {
    query: gql`query getCampaign($campaignId: String!) {
      campaign(id: $campaignId) {
        ${campaignInfoFragment}
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    fetchPolicy: "network-only",
    pollInterval: 60000
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          uuid
          campaignPhoneNumbersEnabled
          availablePhoneNumbers {
            areaCode
            count
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    fetchPolicy: "network-only",
    pollInterval: 20000
  },
  availableActionsData: {
    query: gql`
      query getActions($organizationId: String!) {
        availableActions(organizationId: $organizationId) {
          name
          display_name
          instructions
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    fetchPolicy: "network-only"
  }
});

// Right now we are copying the result fields instead of using a fragment because of https://github.com/apollostack/apollo-client/issues/451
const mapMutationsToProps = ({ ownProps }) => ({
  archiveCampaign: campaignId => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: campaignId => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  startCampaign: campaignId => ({
    mutation: gql`mutation startCampaign($campaignId: String!) {
        startCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  editCampaign: (campaignId, campaign) => ({
    mutation: gql`
      mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          ${campaignInfoFragment}
        }
      },
    `,
    variables: {
      campaignId,
      campaign: _.omit(campaign, "contactsPreview")
    }
  })
});

// Based on the status of the contact import job, renders the in-progress
// screen, the job create screen (to retry an error), or the actual edit
// screen
function AdminCampaignEditRouter(props) {
  if (!props.campaignData.campaign.contactImportJob) {
    // This shouldn't happen
    console.warn("Campaign has no contact import job");
    return <AdminCampaignEdit {...props} />;
  }

  const contactJob = props.campaignData.campaign.contactImportJob;
  if (contactJob.status === "FAILED") {
    return (
      <CreateContainer
        initialError={job.resultMessage}
        organizationId={props.organizationData.organization.id}
        updateCampaign={props.campaignData.campaign.id}
      />
    );
  }

  if (contactJob.status === "PENDING" || contactJob.status === "RUNNING") {
    return (
      <JobProgress
        jobId={contactJob.id}
        text={"Importing Contacts"}
        mode={"determinate"}
      />
    );
  }

  const startJob = props.campaignData.campaign.startJob;
  if (
    startJob &&
    (startJob.status === "PENDING" || startJob.status === "RUNNING")
  ) {
    return (
      <JobProgress
        jobId={startJob.id}
        text={"Starting Your Campaign"}
        mode={"indeterminate"}
      />
    );
  }
  return <AdminCampaignEdit {...props} />;
}

export default loadData(wrapMutations(withRouter(AdminCampaignEditRouter)), {
  mapQueriesToProps,
  mapMutationsToProps
});
