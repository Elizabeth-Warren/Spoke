import React from "react";
import type from "prop-types";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Reassign from "./Reassign";
import ManageTags from "./ManageTags";

const IncomingMessageActions = props => (
  <Card>
    <CardHeader
      title={" Message Actions "}
      actAsExpander
      showExpandableButton
    />
    <CardText expandable>
      <Reassign
        people={props.people}
        conversationCount={props.conversationCount}
        onReassignAllMatchingRequested={props.onReassignAllMatchingRequested}
        onReassignRequested={props.onReassignRequested}
        organizationId={props.organizationId}
      />
      <ManageTags
        tagsFilter={props.tagsFilter}
        onAssignTags={props.onAssignTags}
        onRemoveTags={props.onRemoveTags}
      />
    </CardText>
  </Card>
);

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  onAssignTags: type.func.isRequired,
  onRemoveTags: type.func.isRequired,
  conversationCount: type.number,
  tagsFilter: type.object,
  organizationId: type.string
};

export default IncomingMessageActions;
