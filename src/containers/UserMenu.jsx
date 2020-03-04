import PropTypes from "prop-types";
import React, { Component } from "react";
import Popover from "material-ui/Popover";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import Subheader from "material-ui/Subheader";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import { connect } from "react-apollo";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";
import { hasRoleAtLeast } from "../lib/permissions";

const avatarSize = 28;

class UserMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      anchorEl: null
    };
    this.handleReturn = this.handleReturn.bind(this);
  }

  handleTouchTap = event => {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      open: true,
      anchorEl: event.currentTarget
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false
    });
  };

  handleMenuChange = (event, value) => {
    this.handleRequestClose();
    const { currentUser } = this.props.data;
    if (value === "logout") {
      window.AuthService.logout();
    } else if (value === "account") {
      const { orgId } = this.props;
      if (orgId) {
        this.props.router.push(`/app/${orgId}/account/${currentUser.id}`);
      }
    } else {
      const roleObj = currentUser.allRoles.find(item => item.orgId == value);
      const roleForOrg = roleObj && roleObj.role;
      const isAdmin = hasRoleAtLeast(roleForOrg, "SUPERVOLUNTEER");
      if (isAdmin) {
        this.props.router.push(`/admin/${value}`);
      } else {
        this.props.router.push(`/app/${value}/todos`);
      }
    }
  };

  handleReturn = e => {
    e.preventDefault();
    const { orgId } = this.props;
    this.props.router.push(`/app/${orgId}/todos`);
  };

  renderAvatar(user, size) {
    // Material-UI seems to not be handling this correctly when doing serverside rendering
    const inlineStyles = {
      lineHeight: "1.25",
      textAlign: "center",
      color: "white",
      padding: "5px"
    };
    return (
      <Avatar style={inlineStyles} size={size}>
        {user.displayName.charAt(0)}
      </Avatar>
    );
  }

  render() {
    const { currentUser } = this.props.data;
    if (!currentUser) {
      return <div />;
    }

    return (
      <div>
        <IconButton
          {...dataTest("userMenuButton")}
          onClick={this.handleTouchTap}
          iconStyle={{ fontSize: "18px" }}
        >
          {this.renderAvatar(currentUser, avatarSize)}
        </IconButton>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          targetOrigin={{ horizontal: "left", vertical: "top" }}
          onRequestClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange}>
            <MenuItem
              {...dataTest("userMenuDisplayName")}
              primaryText={currentUser.displayName}
              leftIcon={this.renderAvatar(currentUser, 40)}
              disabled={!this.props.orgId}
              value={"account"}
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
            <Subheader>Teams</Subheader>
            {currentUser.organizations.map(organization => (
              <MenuItem
                key={organization.id}
                primaryText={organization.name}
                value={organization.id}
              />
            ))}
            <Divider />
            <MenuItem
              {...dataTest("home")}
              primaryText="Home"
              onClick={this.handleReturn}
            />
            <Divider />
            <MenuItem
              {...dataTest("userMenuLogOut")}
              primaryText="Log out"
              value="logout"
            />
          </Menu>
        </Popover>
      </div>
    );
  }
}

UserMenu.propTypes = {
  data: PropTypes.object,
  orgId: PropTypes.string,
  router: PropTypes.object
};

const mapQueriesToProps = () => ({
  data: {
    query: gql`
      query getCurrentUserForMenu {
        currentUser {
          id
          displayName
          email
          allRoles {
            orgId
            role
          }
          organizations {
            id
            name
          }
        }
      }
    `,
    fetchPolicy: "network-only"
  }
});

export default connect({
  mapQueriesToProps
})(withRouter(UserMenu));
