import React, { Component } from "react";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import { CircularProgress } from "material-ui";

class JobProgress extends Component {
  componentWillReceiveProps(newProps) {
    const status =
      newProps.jobData.backgroundJob && newProps.jobData.backgroundJob.status;

    if (status === "FAILED" || status === "DONE") {
      if (!this.hasCalledJobComplete) {
        this.hasCalledJobComplete = true;
        newProps.onJobComplete();
      }
    }
  }

  render() {
    const job = this.props.jobData.backgroundJob;
    return (
      <div style={{ marginTop: "50px", textAlign: "center" }}>
        <h2>Importing Contacts</h2>
        <CircularProgress
          mode="determinate"
          value={job.progress * 100}
          size={80}
          thickness={5}
        />
        <h3>{(job.progress * 100).toFixed(1)}%</h3>
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
