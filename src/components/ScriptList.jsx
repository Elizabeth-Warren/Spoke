import PropTypes from "prop-types";
import React from "react";
import FlatButton from "material-ui/FlatButton";
import { List, ListItem } from "material-ui/List";
// import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import CreateIcon from "material-ui/svg-icons/content/create";
// import IconButton from 'material-ui/IconButton'
// import IconMenu from 'material-ui/IconMenu'
// import MenuItem from 'material-ui/MenuItem'
import Divider from "material-ui/Divider";
import Dialog from "material-ui/Dialog";
import CannedResponseForm from "./CannedResponseForm";
import GSSubmitButton from "./forms/GSSubmitButton";
import Form from "react-formal";
import { connect } from "react-apollo";
import gql from "graphql-tag";

// import { insert, update, remove } from '../../api/scripts/methods'

const styles = {
  dialog: {
    zIndex: 10001
  }
};

export default class ScriptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      script: props.script,
      dialogOpen: false
    };
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true
    });
  };

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
      script: null
    });
  };

  render() {
    const {
      scripts,
      onSelectCannedResponse,
      showAddScriptButton,
      customFields,
      campaignId,
      mutations,
      texterId
    } = this.props;
    const { dialogOpen } = this.state;

    // const rightIconButton = (
    //   <IconMenu
    //     iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
    //     anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
    //     targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
    //   >
    //     <MenuItem primaryText={duplicateCampaignResponses && !script.isUserCreated ? "Duplicate and edit" : "Edit"}
    //       onTouchTap={() => this.handleEditScript(script)}
    //     />
    //     {
    //       script.isUserCreated ? (
    //         <MenuItem primaryText="Delete"
    //           onTouchTap={() => this.handleDeleteScript(script.id)}
    //         />
    //       ) : ''
    //     }
    //   </IconMenu>
    // )

    const rightIconButton = null;
    const listItems = scripts.map(script => {
      const title = script.surveyQuestion
        ? `[${script.surveyQuestion}] ${script.title}`
        : script.title;
      return (
        <ListItem
          value={script.text}
          onTouchTap={() => onSelectCannedResponse(script)}
          key={script.id}
          primaryText={title}
          secondaryText={script.text}
          rightIconButton={rightIconButton}
          secondaryTextLines={2}
        />
      );
    });

    const list =
      scripts.length === 0 ? null : (
        <List>
          {listItems}
          <Divider />
        </List>
      );

    return <div>{list}</div>;
  }
}

ScriptList.propTypes = {
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  onSelectCannedResponse: PropTypes.func,
  showAddScriptButton: PropTypes.bool,
  customFields: PropTypes.array,
  campaignId: PropTypes.number,
  mutations: PropTypes.object,
  texterId: PropTypes.number
};
