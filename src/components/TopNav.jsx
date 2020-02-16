import PropTypes from "prop-types";
import React from "react";
import IconButton from "material-ui/IconButton";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import { Link } from "react-router";
import UserMenu from "../containers/UserMenu";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import loadData from "../containers/hoc/load-data";
import gql from "graphql-tag";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    backgroundColor: theme.colors.EWnavy,
    color: theme.colors.white,
    height: 65,
    verticalAlign: "middle",
    paddingLeft: 15,
    paddingRight: 15
  },
  inline: {
    display: "inline-block",
    marginLeft: 5,
    marginRight: 5,
    marginTop: "auto",
    marginBottom: "auto"
  },
  userMenu: {
    marginTop: "auto",
    marginBottom: "auto"
  },
  header: {
    ...theme.text.header,
    fontSize: 24,
    color: theme.colors.white
  },
  flexColumn: {
    flex: 1,
    textAlign: "left",
    display: "flex"
  },
  rightFlexColumn: {
    flex: 1,
    flexDirection: "row-reverse",
    display: "flex"
  }
});

class TopNav extends React.Component {
  state = {
    userMenuOpen: false
  };

  renderBack(backToURL) {
    if (backToURL) {
      return (
        <Link to={backToURL}>
          <IconButton>
            <ArrowBackIcon
              style={{ fill: "white" }}
              color={theme.colors.white}
            />
          </IconButton>
        </Link>
      );
    }
    return <div />;
  }

  render() {
    const { backToURL, orgId, title, data } = this.props;
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.flexColumn)}>
          <div className={css(styles.inline)}>{this.renderBack(backToURL)}</div>
          <div className={css(styles.inline, styles.header)}>{title}</div>
        </div>
        <div className={css(styles.rightFlexColumn)}>
          <div className={css(styles.inline, styles.header)}>
            {data.organization.name}
          </div>
        </div>
        <div className={css(styles.userMenu)}>
          <UserMenu orgId={orgId} />
        </div>
      </div>
    );
  }
}

TopNav.propTypes = {
  backToURL: PropTypes.string,
  title: PropTypes.string.isRequired,
  orgId: PropTypes.string,
  data: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getCurrentOrganization($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
        }
      }
    `,
    variables: {
      organizationId: ownProps.orgId
    },
    fetchPolicy: "network-only"
  }
});

export default loadData(TopNav, { mapQueriesToProps });
