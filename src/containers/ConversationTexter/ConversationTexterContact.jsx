import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import gql from "graphql-tag";
import yup from "yup";
import Form from "react-formal";
import { withRouter } from "react-router";
import ReactDOM from "react-dom";

import RaisedButton from "material-ui/RaisedButton";
import { grey100 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup } from "material-ui/Toolbar";
import CircularProgress from "material-ui/CircularProgress";
import Snackbar from "material-ui/Snackbar";
import CreateIcon from "material-ui/svg-icons/content/create";
import MoodIcon from "material-ui/svg-icons/social/mood";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import { applyScript } from "src/lib/scripts";
import {
  getChildren,
  getTopMostParent,
  interactionStepForId,
  isBetweenTextingHours
} from "src/lib";
import { dataTest } from "src/lib/attributes";
import { getContactTimezone } from "src/lib/timezones";
import { NO_TAG } from "src/lib/tags";
import theme from "src/styles/theme";

import loadData from "../hoc/load-data";
import wrapMutations from "../hoc/wrap-mutations";

import ReplyTools from "src/components/ReplyTools";
import AssignmentTexterSurveys from "src/components/AssignmentTexterSurveys";
import GSForm from "src/components/forms/GSForm";
import SendButton from "src/components/SendButton";
import SendButtonArrow from "src/components/SendButtonArrow";
import Empty from "src/components/Empty";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { getGraphQLErrors } from "src/client/lib/error-helpers";
import { OUTSIDE_HOURS } from "../TextingClosedModal";
import normalizeMessage from "src/lib/normalize-message";

import {
  OptOutDialog,
  SkipDialog,
  ContactToolbar,
  MessageList
} from "./components";

const styles = StyleSheet.create({
  mobile: {
    "@media(minWidth: 425px)": {
      display: "none !important"
    }
  },
  desktop: {
    "@media(maxWidth: 450px)": {
      display: "none !important"
    }
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  mainSectionContainer: {
    display: "flex",
    flexDirection: "row",
    height: "100%"
  },
  centerContainer: {
    display: "flex",
    flexDirection: "column",
    flex: "1",
    width: "calc(100vw - 700px)"
  },

  overlay: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.2,
    backgroundColor: "black",
    color: "white",
    zIndex: 1000000
  },
  messageForm: {
    backgroundColor: "red"
  },
  loadingIndicator: {
    maxWidth: "50%"
  },
  navigationToolbarTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    position: "relative",
    top: 5
  },
  topFixedSection: {
    height: "48px",
    borderBottom: `2px solid ${theme.colors.white}`
  },
  messageSection: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    height: "calc(100% - 50px)"
  },
  responsesSection: {
    backgroundColor: theme.colors.EWlibertyGreen,
    height: "100%",
    width: "400px",
    flexShrink: "0"
  },

  navButtonsWrapper: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  middleScrollingSection: {},
  bottomFixedSection: {
    borderTop: `1px solid ${grey100}`,
    flexShrink: "0",
    position: "relative"
  },
  messageField: {
    padding: "0px 8px",
    "@media(maxWidth: 450px)": {
      marginBottom: "8%"
    }
  },
  textField: {
    // backgroundColor: "lightSteelBlue",
    "@media(maxWidth: 350px)": {
      overflowY: "scroll !important"
    }
  },
  emojiPickerWrapper: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  moodIcon: {
    height: 30,
    width: 30,
    ":hover": {
      fill: theme.colors.EWlibertyGreen
    }
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "row",
    position: "relative"
  },
  lgMobileToolBar: {
    "@media(maxWidth: 449px) and (minWidth: 300px)": {
      display: "inline-block"
    },
    "@media(maxWidth: 320px) and (minWidth: 300px)": {
      marginLeft: "-30px !important"
    }
  },
  countdownContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    boxSizing: "border-box"
  },
  countdown: {
    marginTop: 20,
    borderRadius: 40,
    backgroundColor: theme.colors.EWlibertyGreen,
    color: theme.colors.EWnavy,
    fontSize: 18,
    fontWeight: 800,
    minWidth: 50,
    height: "auto",
    textAlign: "center",
    padding: "2px 10px"
  },

  loadingOverlay: {
    textAlign: "center",
    marginTop: "100px"
  }
});

const inlineStyles = {
  mobileToolBar: {
    position: "absolute",
    bottom: "-5px"
  },
  buttonWidth: {
    minWidth: "110px"
  },
  picker: {
    position: "absolute",
    bottom: 70,
    right: "-150px",
    zIndex: 100
  },
  mobileCannedReplies: {
    "@media(maxWidth: 450px)": {
      marginBottom: "1"
    }
  },
  toolbarIconButton: {
    position: "absolute",
    top: 0
    // without this the toolbar icons are not centered vertically
  },
  actionToolbar: {
    backgroundColor: "white",

    "@media(minWidth: 450px)": {
      marginBottom: 5
    },
    "@media(maxWidth: 450px)": {
      marginBottom: 50
    }
  },

  actionToolbarFirst: {
    backgroundColor: "white"
  },

  snackbar: {
    zIndex: 1000001
  }
};

// TODO: find a nicer way to split this (or AssignmentTexter) into separate components for initial
//  vs conversations, or at the very least put it in "conversation" vs "initial send mode"
export class ConversationTexterContactComponent extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    contactId: PropTypes.string,
    campaign: PropTypes.object,
    assignment: PropTypes.object,
    texter: PropTypes.object,
    router: PropTypes.object,
    advanceContact: PropTypes.func,
    mutations: PropTypes.object,
    forceDisabledDisplayIfNotSendable: PropTypes.bool // remove?
  };

  constructor(props) {
    super(props);

    this.state = this.resetStateForProps(props);
  }

  handleClick = e => {
    const node = ReactDOM.findDOMNode(this.refs.emojiPicker);
    const clickedInEmojiPicker =
      node && node.contains(e.target) && this.state.showEmojiPicker;
    return !clickedInEmojiPicker && this.setState({ showEmojiPicker: false });
  };

  componentWillUnmount() {
    document.body.removeEventListener("mousedown", this.handleClick);
  }

  componentDidMount() {
    document.body.addEventListener("mousedown", this.handleClick);

    const { contact } = this.props.data;
    if (!this.props.forceDisabledDisplayIfNotSendable) {
      if (contact.optOut) {
        this.advanceBecauseOfError();
      } else if (!this.isContactBetweenTextingHours(contact, this.props)) {
        setTimeout(() => {
          this.setState({ disabled: false });
        }, 1500);
      }
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.contactId !== this.props.contactId) {
      this.setState(this.resetStateForProps(nextProps));
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.contactId !== this.props.contactId && this.refs.msgInput) {
      this.focusTextArea();
    }
  }

  setDisabled = async (disabled = true) => {
    this.setState({ disabled });
  };

  getAvailableInteractionSteps(questionResponses, props) {
    const allInteractionSteps = props.campaign.interactionSteps;
    const availableSteps = [];

    let step = getTopMostParent(allInteractionSteps);

    while (step) {
      availableSteps.push(step);
      const questionResponseValue = questionResponses[step.id];
      if (questionResponseValue) {
        const matchingAnswerOption = step.question.answerOptions.find(
          answerOption => answerOption.value === questionResponseValue
        );
        if (matchingAnswerOption && matchingAnswerOption.nextInteractionStep) {
          step = interactionStepForId(
            matchingAnswerOption.nextInteractionStep.id,
            allInteractionSteps
          );
        } else {
          step = null;
        }
      } else {
        step = null;
      }
    }

    return availableSteps;
  }

  getInitialQuestionResponses(questionResponseValues) {
    const questionResponses = {};
    questionResponseValues.forEach(questionResponse => {
      questionResponses[questionResponse.interactionStepId] =
        questionResponse.value;
    });

    return questionResponses;
  }
  getMessageTextFromScript(script) {
    const { campaign, texter } = this.props;
    const { contact } = this.props.data;

    console.log("getMessageTextFromScript: ", contact);
    return script
      ? applyScript({
          contact,
          texter,
          script,
          customFields: campaign.customFields
        })
      : null;
  }

  getStartingMessageText(props) {
    const { campaign } = props;
    const { contact } = props.data;
    const { messages } = contact;
    return messages.length > 0
      ? ""
      : this.getMessageTextFromScript(
          getTopMostParent(campaign.interactionSteps).script
        );
  }

  onMessageInputKeyDown = evt => {
    if (evt.keyCode !== 13) {
      // not an enter press
      return;
    } else if (!evt.shiftKey) {
      // pressing the Enter key submits
      evt.preventDefault();
      this.handleClickSendMessageButton();
    }
  };

  focusTextArea() {
    if (!this.refs.msgInput) {
      return;
    }

    const node = ReactDOM.findDOMNode(this.refs.msgInput);
    if (!node) {
      return;
    }

    const textArea = node.querySelector("textarea[name=messageText]");
    if (!textArea) {
      return;
    }

    textArea.focus();
  }

  resetStateForProps(props) {
    const { assignment, campaign } = props;
    const contact = props.data.contact;
    const questionResponses = this.getInitialQuestionResponses(
      contact.questionResponseValues
    );
    const availableSteps = this.getAvailableInteractionSteps(
      questionResponses,
      props
    );

    let disabled = false;
    let notSendableButForceDisplay = false;
    let disabledText = "Sending...";

    if (assignment.id !== contact.assignmentId || campaign.isArchived) {
      disabledText = "";
      disabled = true;

      this.setState({
        snackbarError: "Your assignment has changed",
        snackbarOnTouchTap: this.goBackToTodos,
        snackbarActionTitle: "Back to Todos"
      });
    } else if (contact.optOut) {
      if (!props.forceDisabledDisplayIfNotSendable) {
        disabledText = "Skipping opt-out...";
        disabled = true;
      } else {
        notSendableButForceDisplay = true;
      }
    } else if (!this.isContactBetweenTextingHours(contact, props)) {
      if (!props.forceDisabledDisplayIfNotSendable) {
        disabledText = "Refreshing ...";
        disabled = true;
      } else {
        notSendableButForceDisplay = true;
      }
    }

    return {
      disabled,
      disabledText,
      notSendableButForceDisplay,
      // this prevents jitter by not showing the optout/skip buttons right after sending
      justSentNew: false,
      questionResponses,
      optOutMessageText: campaign.organization.optOutMessage,
      messageText: this.getStartingMessageText(props),
      optOutDialogOpen: false,
      errorModalOpen: false,
      skipDialogOpen: false,
      currentInteractionStep:
        availableSteps.length > 0
          ? availableSteps[availableSteps.length - 1]
          : null
    };
  }

  handleCannedResponseChange = cannedResponse => {
    this.setState(
      {
        cannedResponseId: cannedResponse.id
      },
      () => {
        this.handleChangeScript(cannedResponse.text);
      }
    );
  };

  createMessageToContact(text, cannedResponseId) {
    const { texter, assignment } = this.props;
    const { contact } = this.props.data;

    return {
      contactNumber: contact.cell,
      userId: texter.id,
      text,
      assignmentId: assignment.id,
      cannedResponseId,
      isInitialMessage: false
    };
  }

  goBackToTodos = () => {
    const { campaign } = this.props;
    this.props.router.push(`/app/${campaign.organization.id}/todos`);
  };

  handleSendMessageError = e => {
    if (e.status === 402) {
      // ???
      this.goBackToTodos();
    } else if (e.status === 400) {
      const newState = {
        snackbarError: e.message
      };
      if (e.message === "Your assignment has changed") {
        newState.snackbarActionTitle = "Back to todos";
        newState.snackbarOnTouchTap = this.goBackToTodos;
        this.setState(newState);
      } else {
        // opt out or send message Error
        this.setState({
          disabled: true,
          disabledText: e.message
        });
        this.advanceBecauseOfError();
      }
    } else {
      console.error(e);
      this.setState({
        snackbarError: "Something went wrong!",
        disabled: false
      });
    }
  };

  handleMessageFormSubmit = async ({ messageText: rawMessageText }) => {
    const messageText = normalizeMessage(rawMessageText);

    if (!messageText) {
      this.refs.form.setFormError("messageText", "Can't send empty message");
      return;
    }

    if (
      this.props.data.contact.messages.find(
        m => !m.isFromContact && m.text === messageText
      )
    ) {
      this.refs.form.setFormError(
        "messageText",
        "You've already sent that message to this contact"
      );
      return;
    }

    try {
      const { contact } = this.props.data;

      const message = this.createMessageToContact(
        messageText,
        this.state.cannedResponseId
      );
      if (this.state.disabled) {
        return; // stops from multi-send
      }
      this.setState({ disabled: true });

      const sendMessageResult = await this.props.mutations.sendMessage(
        message,
        contact.id
      );

      const graphQLErrors = getGraphQLErrors(sendMessageResult);
      const codes = graphQLErrors.map(error => error.code);

      if (codes.includes("CAMPAIGN_CLOSED")) {
        this.props.showCampaignClosedModal();
      } else if (codes.includes("TEXTING_HOURS")) {
        this.props.showCampaignClosedModal(OUTSIDE_HOURS);
      }

      if (sendMessageResult.errors && this.props.campaign.organization.id) {
        this.handleSendMessageError(sendMessageResult.errors);
      }

      await this.handleSubmitSurveys();

      this.setState({
        disabled: false,
        messageText: ""
      });
    } catch (e) {
      this.handleSendMessageError(e);
    }
  };

  handleSubmitSurveys = async () => {
    const { contact } = this.props.data;

    const deletionIds = [];
    const questionResponseObjects = [];

    const interactionStepIds = Object.keys(this.state.questionResponses);

    const count = interactionStepIds.length;

    for (let i = 0; i < count; i++) {
      const interactionStepId = interactionStepIds[i];
      const value = this.state.questionResponses[interactionStepId];
      if (value) {
        questionResponseObjects.push({
          interactionStepId,
          campaignContactId: contact.id,
          value
        });
      } else {
        deletionIds.push(interactionStepId);
      }
    }
    if (questionResponseObjects.length) {
      await this.props.mutations.updateQuestionResponses(
        questionResponseObjects,
        contact.id
      );
    }
    if (deletionIds.length) {
      await this.props.mutations.deleteQuestionResponses(
        deletionIds,
        contact.id
      );
    }
  };

  handleSkipContact = async () => {
    await this.handleSubmitSurveys();
    await this.handleApplyTag();
    await this.handleEditMessageStatus("closed");
    this.props.advanceContact();
  };

  handleApplyTag = async () => {
    if (!!this.state.tag && this.state.tag !== NO_TAG.value) {
      await this.props.mutations.addTag(
        [this.props.contactId],
        [this.state.tag],
        ""
      );
      this.setState({
        tag: undefined,
        skipComment: undefined
      });
    }
  };

  handleEditMessageStatus = async messageStatus => {
    const { contact } = this.props.data;
    await this.props.mutations.editCampaignContactMessageStatus(
      messageStatus,
      contact.id
    );
  };

  handleOptOut = async () => {
    const optOutMessageText = this.state.optOutMessageText;
    const { contact } = this.props.data;
    const { assignment } = this.props;
    const message = this.createMessageToContact(optOutMessageText);
    if (this.state.disabled) {
      return; // stops from multi-send
    }
    this.setState({ disabled: true });
    try {
      if (optOutMessageText.length) {
        const sendMessageResult = await this.props.mutations.sendMessage(
          message,
          contact.id
        );
        if (sendMessageResult.errors && this.props.campaign.organization.id) {
          this.props.router.push(
            `/app/${this.props.campaign.organization.id}/suspended`
          );
        }
      }

      const optOut = {
        cell: contact.cell,
        assignmentId: assignment.id
      };

      await this.handleSubmitSurveys();
      const optOutRes = await this.props.mutations.createOptOut(
        optOut,
        contact.id
      );

      this.setState({ disabled: false });

      if (optOutRes.errors) {
        this.toggleErrorModal();
      } else {
        this.props.advanceContact();
      }
    } catch (e) {
      this.handleSendMessageError(e);
    }
  };

  handleOpenSkipDialog = () => {
    this.setState({ skipDialogOpen: true });
  };

  handleCloseSkipDialog = () => {
    this.setState({ skipDialogOpen: false });
  };

  handleOpenDialog = () => {
    this.setState({ optOutDialogOpen: true });
  };

  toggleErrorModal = () =>
    this.setState(prevState => {
      const errorModalOpen = !prevState.errorModalOpen;
      return { errorModalOpen };
    });

  handleCloseDialog = () => {
    this.setState({ optOutDialogOpen: false });
  };

  handleChangeScript = newScript => {
    const messageText = this.getMessageTextFromScript(newScript);

    this.setState(
      {
        messageText
      },
      () => this.focusTextArea()
    );
  };

  handleQuestionResponseChange = ({
    interactionStep,
    questionResponseValue,
    nextScript
  }) => {
    const { questionResponses } = this.state;
    const { interactionSteps } = this.props.campaign;
    questionResponses[interactionStep.id] = questionResponseValue;

    const children = getChildren(interactionStep, interactionSteps);
    for (const childStep of children) {
      if (childStep.id in questionResponses) {
        questionResponses[childStep.id] = null;
      }
    }

    this.setState(
      {
        cannedResponseId: undefined,
        questionResponses
      },
      () => {
        this.handleChangeScript(nextScript);
      }
    );
  };

  handleClickSendMessageButton = () => {
    this.refs.form.submit();
    if (this.props.data.contact.messageStatus === "needsMessage") {
      this.setState({ justSentNew: true });
    }
  };

  isContactBetweenTextingHours(contact, props) {
    const { campaign } = props;

    let timezoneData = null;

    if (
      contact.location &&
      contact.location.timezone &&
      contact.location.timezone.offset
    ) {
      const { hasDST, offset } = contact.location.timezone;

      timezoneData = { hasDST, offset };
    } else {
      const location = getContactTimezone(props.campaign, contact.location);
      if (location) {
        const timezone = location.timezone;
        if (timezone) {
          timezoneData = timezone;
        }
      }
    }

    const {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced
    } = campaign.organization;
    const config = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced
    };

    if (campaign.overrideOrganizationTextingHours) {
      config.campaignTextingHours = {
        textingHoursStart: campaign.textingHoursStart,
        textingHoursEnd: campaign.textingHoursEnd,
        textingHoursEnforced: campaign.textingHoursEnforced,
        timezone: campaign.timezone
      };
    }

    return isBetweenTextingHours(timezoneData, config);
  }

  // note: this is not the same as skipping with tag
  advanceBecauseOfError = () => {
    setTimeout(() => {
      this.props.advanceContact();
      this.setState({ disabled: false });
    }, 1500);
  };

  messageSchema = yup.object({
    messageText: yup.string().max(window.MAX_MESSAGE_LENGTH)
  });

  handleMessageFormChange = ({ messageText }) => {
    this.refs.form.resetFormErrors();

    const newState = { messageText };
    // Clear out the canned response id if it's set and the message gets
    // cleared completely.
    // TODO: do we want to do something similar for question responses?
    if (this.state.cannedResponseId && !messageText) {
      newState.cannedResponseId = undefined;
    }
    this.setState(newState);
  };

  renderSkipDialog = () => (
    <SkipDialog
      tag={this.state.tag}
      comment={this.state.skipComment}
      open={this.state.skipDialogOpen}
      skipMessageText={this.state.optOutMessageText}
      disabled={this.state.disabled || this.state.notSendableButForceDisplay}
      onSkip={this.handleSkipContact}
      onRequestClose={this.handleCloseSkipDialog}
      onSkipCommentChanged={skipComment => this.setState({ skipComment })}
      onTagChanged={tag => this.setState({ tag })}
    />
  );

  renderErrorModal = () => (
    <Dialog
      title="Oh no! There's been an error."
      open={this.state.errorModalOpen}
      modal
      actions={
        <FlatButton
          label="Close"
          primary
          onClick={() => {
            this.toggleErrorModal();
            this.props.advanceContact();
          }}
        />
      }
    >
      <span>
        We may not have been able to successfully opt out this number. Please
        contact an administrator in Slack to ensure that opt out is saved to our
        database. Thanks!
      </span>
    </Dialog>
  );

  renderOptOutDialog = () => (
    <OptOutDialog
      open={this.state.optOutDialogOpen}
      optOutMessageText={this.state.optOutMessageText}
      disabled={this.state.disabled || this.state.notSendableButForceDisplay}
      onOptOut={this.handleOptOut}
      onRequestClose={this.handleCloseDialog}
      onOptOutMessageTextChanged={optOutMessageText =>
        this.setState({ optOutMessageText })
      }
    />
  );

  renderMiddleScrollingSection() {
    const { contact } = this.props.data;
    return <MessageList contact={contact} messages={contact.messages} />;
  }

  renderSurveySection() {
    const { contact } = this.props.data;
    const { messages } = contact;

    const { questionResponses } = this.state;

    const availableInteractionSteps = this.getAvailableInteractionSteps(
      questionResponses,
      this.props
    );

    return messages.length === 0 ? (
      <Empty
        title={"This is your first message to " + contact.firstName}
        icon={<CreateIcon />}
        hideMobile
      />
    ) : (
      <div>
        <AssignmentTexterSurveys
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          questionResponses={questionResponses}
        />
      </div>
    );
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact;
    let button = null;
    if (messageStatus === "closed") {
      button = (
        <RaisedButton
          onClick={() => this.handleEditMessageStatus("needsResponse")}
          label="Reopen"
          style={inlineStyles.buttonWidth}
        />
      );
    } else {
      button = (
        <RaisedButton
          onClick={this.handleOpenSkipDialog}
          label={messageStatus === "needsResponse" ? "Skip Reply" : "Skip"}
          style={inlineStyles.buttonWidth}
        />
      );
    }

    return button;
  }

  renderActionToolbar() {
    const { campaign } = this.props;
    const { contact } = this.props.data;

    return (
      <div>
        <Toolbar style={inlineStyles.actionToolbarFirst}>
          <ToolbarGroup firstChild></ToolbarGroup>
          <ToolbarGroup>
            {this.renderNeedsResponseToggleButton(contact)}
            <SendButton
              threeClickEnabled={campaign.organization.threeClickEnabled}
              onFinalTouchTap={this.handleClickSendMessageButton}
              disabled={
                this.state.disabled || this.state.notSendableButForceDisplay
              }
            />
          </ToolbarGroup>
        </Toolbar>
      </div>
    );
  }

  renderTopFixedSection() {
    const { contact } = this.props.data;
    return (
      <ContactToolbar
        campaign={this.props.campaign}
        assignment={this.props.assignment}
        campaignContact={contact}
        onClickOptOut={this.handleOpenDialog}
      />
    );
  }

  renderReplyTools() {
    const { campaign, assignment } = this.props;
    const { contact } = this.props.data;
    const { campaignCannedResponses } = assignment;

    const nonDeletedResponses = campaignCannedResponses.filter(r => !r.deleted);

    const shiftingConfigurationJSON = campaign.shiftingConfiguration;
    const shiftingConfiguration = shiftingConfigurationJSON
      ? JSON.parse(shiftingConfigurationJSON)
      : { enabled: false };

    return (
      <ReplyTools
        campaignCannedResponses={nonDeletedResponses}
        onSelectCannedResponse={this.handleCannedResponseChange}
        shiftingConfiguration={shiftingConfiguration}
        contact={contact}
        assignment={assignment}
      />
    );
  }

  addEmoji = emoji => {
    const { messageText } = this.state;
    const text = `${messageText}${emoji.native}`;

    this.setState({
      messageText: text,
      showEmojiPicker: false
    });
  };

  renderCorrectSendButton() {
    const { campaign } = this.props;
    const { contact } = this.props.data;
    console.log("RENDER: ", contact);
    if (
      contact.messageStatus === "messaged" ||
      contact.messageStatus === "convo" ||
      contact.messageStatus === "needsResponse"
    ) {
      return (
        <SendButtonArrow
          threeClickEnabled={campaign.organization.threeClickEnabled}
          onFinalTouchTap={this.handleClickSendMessageButton}
          disabled={
            !!(this.state.disabled || this.state.notSendableButForceDisplay)
          }
        />
      );
    }
    return null;
  }

  handleShowEmojiPicker = () => {
    this.setState(prevState => ({
      showEmojiPicker: !prevState.showEmojiPicker
    }));
  };

  renderBottomFixedSection() {
    const { optOutDialogOpen, skipDialogOpen } = this.state;
    const { contact } = this.props.data;
    const { messageStatus } = contact;

    const message =
      optOutDialogOpen || skipDialogOpen ? (
        ""
      ) : (
        <div className={css(styles.messageField)}>
          <GSForm
            ref="form"
            schema={this.messageSchema}
            value={{ messageText: this.state.messageText }}
            onSubmit={this.handleMessageFormSubmit}
            onChange={
              messageStatus === "needsMessage"
                ? ""
                : this.handleMessageFormChange
            }
          >
            <div className={css(styles.messageWrapper)}>
              <Form.Field
                className={css(styles.textField)}
                name="messageText"
                label="Your message"
                multiLine
                fullWidth
                rowsMax={6}
                autoFocus
                ref="msgInput"
                onKeyDown={this.onMessageInputKeyDown}
                floatingLabelStyle={{ color: theme.colors.EWnavy }}
                underlineStyle={{ borderColor: theme.colors.EWnavy }}
                hintStyle={{ color: theme.colors.EWnavy }}
              />

              <div ref="emojiPicker" className={css(styles.emojiPickerWrapper)}>
                {this.state.showEmojiPicker && (
                  <Picker
                    style={inlineStyles.picker}
                    className={css(styles.picker)}
                    onSelect={this.addEmoji}
                    color={theme.colors.EWdarkLibertyGreen}
                    title=""
                    emoji={"statue_of_liberty"}
                  />
                )}
                <MoodIcon
                  onClick={this.handleShowEmojiPicker}
                  className={css(styles.moodIcon)}
                  color={theme.colors.lightGray}
                />
              </div>
            </div>

            {this.renderCorrectSendButton()}
          </GSForm>
        </div>
      );

    return (
      <div>
        {this.renderSurveySection()}
        <div>
          {message}
          {optOutDialogOpen || skipDialogOpen ? "" : this.renderActionToolbar()}
        </div>
        {this.renderSkipDialog()}
        {this.renderOptOutDialog()}
      </div>
    );
  }

  // todo middle scrolling section needs to be 800px and then next to it needs to
  render() {
    if (this.props.contactId !== this.props.data.contact.id) {
      // still loading new contact
      return (
        <div className={css(styles.loadingOverlay)}>
          <CircularProgress size={100} />
        </div>
      );
    }

    return (
      <div className={css(styles.container)}>
        {this.state.errorModalOpen && this.renderErrorModal()}
        <div className={css(styles.mainSectionContainer)}>
          <div className={css(styles.centerContainer)}>
            <div className={css(styles.topFixedSection)}>
              {this.renderTopFixedSection()}
            </div>
            <div className={css(styles.messageSection)}>
              {this.renderMiddleScrollingSection()}
              <div className={css(styles.bottomFixedSection)}>
                {this.renderBottomFixedSection()}
                {this.state.disabled ? (
                  <div className={css(styles.overlay)}>
                    <CircularProgress size={0.5} />
                    {this.state.disabledText}
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
          <div className={css(styles.responsesSection)}>
            {this.renderReplyTools()}
          </div>
        </div>
        <Snackbar
          style={inlineStyles.snackbar}
          open={!!this.state.snackbarError}
          message={this.state.snackbarError || ""}
          action={this.state.snackbarActionTitle}
          onActionClick={this.state.snackbarOnTouchTap}
          onRequestClose={() => this.setState({ snackbarError: null })}
        />
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getContact($contactId: String!) {
        contact(id: $contactId) {
          id
          assignmentId
          firstName
          lastName
          cell
          customFields
          state_code
          hasUnresolvedTags
          optOut {
            id
          }
          questionResponseValues {
            interactionStepId
            value
          }
          location {
            city
            state
            timezone {
              offset
              hasDST
            }
          }
          messageStatus
          issues
          updatedAt
          messages {
            id
            createdAt
            text
            isFromContact
            attachments
          }
        }
      }
    `,
    variables: {
      contactId: ownProps.contactId
    },
    // avoid caching issues when loading this contact in the conversation view
    // after initial send
    fetchPolicy: "network-only",
    // provide an interactive-ish texting experience when on a contact page
    pollInterval: 5000
  }
});

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut(
        $optOut: OptOutInput!
        $campaignContactId: String!
      ) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    },

    refetchQueries: ["getContact"]
  }),
  editCampaignContactMessageStatus: (messageStatus, campaignContactId) => ({
    mutation: gql`
      mutation editCampaignContactMessageStatus(
        $messageStatus: String!
        $campaignContactId: String!
      ) {
        editCampaignContactMessageStatus(
          messageStatus: $messageStatus
          campaignContactId: $campaignContactId
        ) {
          id
          messageStatus
          updatedAt
        }
      }
    `,
    variables: {
      messageStatus,
      campaignContactId
    },

    refetchQueries: ["getContact"]
  }),
  deleteQuestionResponses: (interactionStepIds, campaignContactId) => ({
    mutation: gql`
      mutation deleteQuestionResponses(
        $interactionStepIds: [String]
        $campaignContactId: String!
      ) {
        deleteQuestionResponses(
          interactionStepIds: $interactionStepIds
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    },

    refetchQueries: ["getContact"]
  }),
  updateQuestionResponses: (questionResponses, campaignContactId) => ({
    mutation: gql`
      mutation updateQuestionResponses(
        $questionResponses: [QuestionResponseInput]
        $campaignContactId: String!
      ) {
        updateQuestionResponses(
          questionResponses: $questionResponses
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      questionResponses,
      campaignContactId
    },
    refetchQueries: ["getContact"]
  }),
  sendMessage: (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage(
        $message: MessageInput!
        $campaignContactId: String!
      ) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          updatedAt
          messages {
            id
            createdAt
            text
            isFromContact
            attachments
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    },
    refetchQueries: ["getContact"]
  }),
  addTag: (campaignContactIds, tags, comment) => ({
    mutation: gql`
      mutation addTag(
        $campaignContactIds: [String]!
        $tags: [String]!
        $comment: String
      ) {
        addTagsToCampaignContacts(
          campaignContactIds: $campaignContactIds
          tags: $tags
          comment: $comment
        )
      }
    `,
    variables: {
      campaignContactIds,
      tags,
      comment
    },
    refetchQueries: ["getContact"]
  })
});

export default loadData(
  wrapMutations(withRouter(ConversationTexterContactComponent)),
  {
    mapQueriesToProps,
    mapMutationsToProps
  }
);
