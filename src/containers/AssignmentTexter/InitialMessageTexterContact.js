import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import Form from "react-formal";
import yup from "yup";
import confetti from "canvas-confetti";

import { Tabs, Tab } from "material-ui";
import { grey100 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup } from "material-ui/Toolbar";
import CreateIcon from "material-ui/svg-icons/content/create";
import CircularProgress from "material-ui/CircularProgress";

import GSForm from "src/components/forms/GSForm";
import SendButton from "src/components/SendButton";
import { withRouter } from "react-router";
import Empty from "src/components/Empty";
import { dataTest } from "src/lib/attributes";
import theme from "src/styles/theme";
import CampaignTopBar from "src/containers/CampaignTopBar";

import ContactToolbar from "../ConversationTexter/components/ContactToolbar";

const CONFETTI_INTERVAL = 10;

// TODO: share styles with conversationtexter
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
    margin: 0,
    position: "absolute",
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column"
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
    // opacity: 0.2,
    // backgroundColor: "black",
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
    flex: "0 0 auto",
    borderBottom: `2px solid ${theme.colors.white}`
  },
  mainSectionContainer: {
    display: "flex",
    height: "calc(100vh - 48px)"
  },
  messageSection: {
    width: "calc(100% - 650px)",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },

  responsesSection: {
    backgroundColor: theme.colors.EWlibertyGreen,
    height: "100%",
    width: "400px",
    overflowY: "scroll"
  },

  contactsSection: {
    backgroundColor: theme.colors.EWnavy,
    color: "white",
    height: "100%",
    width: "250px",
    overflowY: "scroll"
  },

  navButtonsWrapper: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  middleScrollingSection: {
    flex: "1 1 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical"
  },
  bottomFixedSection: {
    borderTop: `1px solid ${grey100}`,
    flexShrink: "0"
  },
  messageField: {
    padding: "0px 8px",
    "@media(maxWidth: 450px)": {
      marginBottom: "8%"
    }
  },
  textField: {
    "@media(maxWidth: 350px)": {
      overflowY: "scroll !important"
    }
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

  confettiCanvas: {
    width: "100%",
    height: "calc(100vh - 100px)"
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

  mobileCannedReplies: {
    "@media(maxWidth: 450px)": {
      marginBottom: "1"
    }
  },
  exitTexterIconButton: {
    float: "right",
    height: "50px",
    zIndex: 100
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

export class InitialMessageTexterContact extends Component {
  static propTypes = {
    assignment: PropTypes.object,
    campaign: PropTypes.object,
    contact: PropTypes.object,
    contactsRemaining: PropTypes.number,
    messageText: PropTypes.string,
    texter: PropTypes.object,
    sendMessage: PropTypes.func,
    router: PropTypes.object,
    exitTexter: PropTypes.func
  };

  messageSchema = yup.object({
    messageText: yup
      .string()
      .required("Can't send empty message")
      .max(640) // 4 segments
  });

  constructor(props) {
    super(props);
    this.state = {
      disabled: false
    };
    this.onEnter = this.onEnter.bind(this);
    this.setDisabled = this.setDisabled.bind(this);
  }

  componentDidMount() {
    // TODO: don't allow users to hold down enter
    // https://unixpapa.com/js/testkey.html
    // note: key*down* is necessary to stop propagation of keyup for the textarea element
    document.body.addEventListener("keyup", this.onEnter);

    this.confetti = confetti.create(this.confettiCanvas, {
      resize: true
    });
  }

  componentWillUnmount() {
    document.body.removeEventListener("keyup", this.onEnter);
  }

  async onEnter(evt) {
    if (evt.keyCode === 13) {
      evt.preventDefault();
      this.handleClickSendMessageButton();
    }
  }

  setDisabled = async (disabled = true) => {
    this.setState({ disabled });
  };

  createMessageInput(text) {
    const { texter, contact, assignment } = this.props;

    return {
      contactNumber: contact.cell,
      userId: texter.id, // TODO: shouldn't need this
      text,
      assignmentId: assignment.id,
      isInitialMessage: true
    };
  }

  handleMessageFormSubmit = async ({ messageText }) => {
    const { contact } = this.props;

    const message = this.createMessageInput(messageText);
    if (this.state.disabled) {
      return; // stops from multi-send
    }
    this.setState({ disabled: true });

    await this.props.sendMessage(message, contact.id);
    // Note: error handling is dealt with in the parent component
    this.setState({
      disabled: false
    });
  };

  handleClickSendMessageButton = async () => {
    await this.refs.form.submit();

    if (this.props.contactsRemaining % CONFETTI_INTERVAL === 0) {
      this.confetti({
        spread: 20,
        startVelocity: 60,
        origin: {
          y: 1.2
        },
        colors: ["#232444", "#b61b28"]
      });
    }
  };

  renderFirstMessagePlaceholder() {
    const { contact } = this.props;

    return (
      <Empty
        title={"This is your first message to " + contact.firstName}
        icon={<CreateIcon />}
        hideMobile
      />
    );
  }

  renderActionToolbar() {
    return (
      <div>
        <Toolbar style={inlineStyles.actionToolbarFirst}>
          <ToolbarGroup firstChild>
            <SendButton
              onFinalTouchTap={this.handleClickSendMessageButton}
              disabled={this.state.disabled}
            />
          </ToolbarGroup>
        </Toolbar>
      </div>
    );
  }

  renderTopFixedSection() {
    const { contact } = this.props;
    return (
      <ContactToolbar
        campaign={this.props.campaign}
        assignment={this.props.assignment}
        campaignContact={contact}
      />
    );
  }

  renderBottomFixedSection = () => {
    const message = (
      <div className={css(styles.messageField)}>
        <GSForm
          ref="form"
          schema={this.messageSchema}
          value={{ messageText: this.props.messageText }}
          onSubmit={this.handleMessageFormSubmit}
          //  Editing initial message disabled:
          // onChange={this.handleMessageFormChange}
        >
          <Form.Field
            className={css(styles.textField)}
            name="messageText"
            label="Your message"
            multiLine
            fullWidth
            rowsMax={6}
          />
        </GSForm>
      </div>
    );

    return (
      <div>
        {this.state.disabled ? (
          <div className={css(styles.overlay)}>
            <CircularProgress size={100} thickness={5} />
          </div>
        ) : (
          this.renderFirstMessagePlaceholder()
        )}
        <div>
          {message}
          {this.renderActionToolbar()}
        </div>
      </div>
    );
  };

  renderInitialSendProgress() {
    return (
      <Tabs value="left-to-send">
        <Tab value="left-to-send" label="Left To Send">
          <div className={css(styles.countdownContainer)}>
            <span className={css(styles.countdown)}>
              {this.props.contactsRemaining}
            </span>
          </div>
        </Tab>
      </Tabs>
    );
  }

  renderResponsesPlaceholder() {
    return (
      <Tabs value="confetti">
        <Tab value="confetti" label="You Are Awesome">
          <canvas
            className={css(styles.confettiCanvas)}
            ref={c => (this.confettiCanvas = c)}
          />
        </Tab>
      </Tabs>
    );
  }

  render() {
    return (
      <div>
        <CampaignTopBar
          campaign={this.props.campaign}
          organizationId={this.props.campaign.organization.id}
        />
        <div className={css(styles.container)}>
          <div className={css(styles.mainSectionContainer)}>
            <div className={css(styles.contactsSection)}>
              {this.renderInitialSendProgress()}
            </div>
            <div className={css(styles.messageSection)}>
              <div className={css(styles.topFixedSection)}>
                {this.renderTopFixedSection()}
              </div>
              <div
                {...dataTest("messageList")}
                ref="messageScrollContainer"
                className={css(styles.middleScrollingSection)}
              ></div>
              <div className={css(styles.bottomFixedSection)}>
                {this.renderBottomFixedSection()}
              </div>
            </div>
            <div className={css(styles.responsesSection)}>
              {this.renderResponsesPlaceholder()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(InitialMessageTexterContact);
