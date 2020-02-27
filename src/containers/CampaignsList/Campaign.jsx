import PropTypes from "prop-types";
import React from "react";
import { ListItem } from "material-ui/List";
import moment from "moment";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import IconButton from "material-ui/IconButton";
import SettingsIcon from "material-ui/svg-icons/action/settings";
import Checkbox from "material-ui/Checkbox";
import theme from "../../styles/theme";
import Chip from "../../components/Chip";
import { dataTest } from "../../lib/attributes";

const inlineStyles = {
  past: {
    opacity: 0.6,
    paddingRight: 80
  },
  warn: {
    color: theme.colors.EWred,
    fontWeight: 900,
    paddingRight: 80
  },
  good: {
    color: theme.colors.EWnavy,
    fontWeight: 900,
    paddingRight: 80
  },
  warnUnsent: {
    color: theme.colors.EWred,
    fontWeight: 900,
    paddingRight: 80
  }
};

const renderRightIcon = (campaign, onClickCampaignStatusIcon) => {
  const { id, status, isArchived } = campaign;
  return (
    !isArchived && (
      <IconButton
        tooltip="Change Status"
        onClick={() => onClickCampaignStatusIcon(id, status)}
      >
        <SettingsIcon />
      </IconButton>
    )
  );
};

const Campaign = props => {
  const {
    campaign,
    adminPerms,
    selectMultiple,
    onClickCampaignStatusIcon
  } = props;

  const {
    isStarted,
    isArchived,
    hasUnassignedContacts,
    hasUnsentInitialMessages
  } = campaign;

  let listItemStyle = {};
  let leftIcon = null;
  if (isArchived) {
    listItemStyle = inlineStyles.past;
  } else if (!isStarted || hasUnassignedContacts) {
    listItemStyle = inlineStyles.warn;
    leftIcon = <WarningIcon />;
  } else if (hasUnsentInitialMessages) {
    listItemStyle = inlineStyles.warnUnsent;
  } else {
    listItemStyle = inlineStyles.good;
  }

  const dueByMoment = moment(campaign.dueBy);
  const creatorName = campaign.creator ? campaign.creator.displayName : null;
  const tags = [];
  if (!isStarted) {
    tags.push("Not started");
  }

  if (hasUnassignedContacts) {
    tags.push("Unassigned contacts");
  }

  if (isStarted && hasUnsentInitialMessages) {
    tags.push("Unsent initial messages");
  }

  const primaryText = (
    <div>
      {campaign.title}
      {tags.map(tag => (
        <Chip key={tag} text={tag} />
      ))}
    </div>
  );
  const secondaryText = (
    <span>
      <span>
        Campaign ID: {campaign.id}
        <br />
        {campaign.description}
        {creatorName ? <span> &mdash; Created by {creatorName}</span> : null}
        <br />
        {dueByMoment.isValid()
          ? dueByMoment.utc().format("MMM D, YYYY")
          : "No due date set"}
      </span>
    </span>
  );

  const campaignUrl = `/admin/${props.organizationId}/campaigns/${campaign.id}`;
  return (
    <ListItem
      {...dataTest("campaignRow")}
      style={listItemStyle}
      key={campaign.id}
      primaryText={primaryText}
      onClick={({
        currentTarget: {
          firstElementChild: {
            firstElementChild: { checked }
          }
        }
      }) => {
        if (selectMultiple) {
          return props.handleChecked({ campaignId: campaign.id, checked });
        }

        return !isStarted
          ? props.router.push(`${campaignUrl}/edit`)
          : props.router.push(campaignUrl);
      }}
      secondaryText={secondaryText}
      leftIcon={!selectMultiple ? leftIcon : null}
      rightIconButton={
        !selectMultiple && adminPerms
          ? renderRightIcon(campaign, onClickCampaignStatusIcon)
          : null
      }
      leftCheckbox={selectMultiple ? <Checkbox /> : null}
    />
  );
};

Campaign.propTypes = {
  campaign: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  router: PropTypes.object,
  handleChecked: PropTypes.func,
  organizationId: PropTypes.string
};

export default Campaign;
