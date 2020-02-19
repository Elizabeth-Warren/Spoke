import React from "react";
import types from "prop-types";

import ContactToolbar from "./ContactToolbar";

export default function EmptyState({ campaign }) {
  return (
    <div>
      <ContactToolbar
        campaign={campaign}
        campaignContact={null}
        assignment={null}
      />
      <div style={{ textAlign: "center" }}>
        <p>No Conversations.</p>
      </div>
    </div>
  );
}

EmptyState.propTypes = {
  campaign: types.object
};
