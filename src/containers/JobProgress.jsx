import React, { Component } from "react";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import { CircularProgress } from "material-ui";
import types from "prop-types";

class JobProgress extends Component {
  static propTypes = {
    jobId: types.string,
    mode: types.string,
    text: types.string
  };

  render() {
    const job = this.props.jobData.backgroundJob;
    return (
      <div style={{ marginTop: "50px", textAlign: "center" }}>
        <h2>{this.props.text}</h2>
        <CircularProgress
          mode={this.props.mode}
          value={
            this.props.mode === "indeterminate" ? null : job.progress * 100
          }
          size={80}
          thickness={5}
        />
        {this.props.mode === "determinate" ? (
          <h3>{(job.progress * 100).toFixed(1)}%</h3>
        ) : null}
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  jobData: {
    query: gql`
      query getJobData($jobId: ID!) {
        backgroundJob(jobId: $jobId) {
          id
          resultMessage
          progress
          status
        }
      }
    `,
    variables: {
      jobId: ownProps.jobId
    },
    pollInterval: 2500
  }
});

export default loadData(JobProgress, {
  mapQueriesToProps
});
