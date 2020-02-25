import React from "react";
import { RaisedButton } from "material-ui";
import { withRouter } from "react-router";

function Error404({ router }) {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <div>
        <img src="https://ew-spoke-public.elizabethwarren.codes/nope.gif" />
      </div>
      <h1>There's No Page Here</h1>
      <p style={{ margin: "25px 0" }}>
        Sorry, this page doesn't exist. You'll have to look elsewhere for big,
        structural, change!
      </p>
      <RaisedButton label="Go Home" onClick={() => router.push("/")} />
    </div>
  );
}

export default withRouter(Error404);
