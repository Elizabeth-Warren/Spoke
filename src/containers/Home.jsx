import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";
import wrapMutations from "./hoc/wrap-mutations";
import theme from "../styles/theme";
import { withRouter } from "react-router";

const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center",
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  logoDiv: {
    ...theme.components.logoDiv
  },
  logoImg: {
    width: 120,
    ...theme.components.logoImg
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link_dark_bg: {
    ...theme.text.link_dark_bg
  }
});

class Home extends React.Component {
  state = {
    orgLessUser: false
  };

  UNSAFE_componentWillMount() {
    const user = this.props.data.currentUser;
    if (user) {
      if (user.adminOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.adminOrganizations[0].id}`);
      } else if (user.ownerOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.ownerOrganizations[0].id}`);
      } else if (user.texterOrganizations.length > 0) {
        this.props.router.push(`/app/${user.texterOrganizations[0].id}`);
      } else if (user.suspendedOrganizations.length > 0) {
        this.props.router.push(`/app/${user.suspendedOrganizations[0].id}`);
      } else {
        this.setState({ orgLessUser: true });
      }
    }
  }

  // not sure if we need this anymore -- only for new organizations
  handleOrgInviteClick = async e => {
    if (!window.SUPPRESS_SELF_INVITE) {
      e.preventDefault();
      this.props.router.push(`/login?nextUrl=/createOrganization`);
    }
  };

  renderContent() {
    if (this.state.orgLessUser) {
      return (
        <div>
          <div className={css(styles.header)}>Welcome to Spoke!</div>
          <div>
            When you join a text campaign, it will show up here. Check Slack to
            get a link!
            <br />
            <br />
            <a
              id="login"
              className={css(styles.link_dark_bg)}
              href="/logout-callback"
            >
              Logout
            </a>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className={css(styles.header)}>
          Spoke is a new way to run campaigns using text messaging.
        </div>
        <div>
          <a
            id="login"
            className={css(styles.link_dark_bg)}
            href="/login"
            onClick={this.handleOrgInviteClick}
          >
            Login and get started
          </a>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.logoDiv)}>
          <img
            src="https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg"
            className={css(styles.logoImg)}
          />
        </div>
        <div className={css(styles.content)}>{this.renderContent()}</div>
      </div>
    );
  }
}

Home.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  data: PropTypes.object
};

const mapQueriesToProps = () => ({
  data: {
    query: gql`
      query getCurrentUser {
        currentUser(allowNull: true) {
          id
          adminOrganizations: organizations(role: "ADMIN") {
            id
          }
          ownerOrganizations: organizations(role: "OWNER") {
            id
          }
          texterOrganizations: organizations(role: "TEXTER") {
            id
          }
          suspendedOrganizations: organizations(role: "SUSPENDED") {
            id
          }
        }
      }
    `
  }
});

export default loadData(wrapMutations(withRouter(Home)), {
  mapQueriesToProps
});
