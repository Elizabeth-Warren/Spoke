import React from "react";
import loadData from "src/containers/hoc/load-data";
import wrapMutations from "src/containers/hoc/wrap-mutations";
import gql from "graphql-tag";
import Component from "./AdminCampaignCreateComponent";
import { withRouter } from "react-router";

// Right now we are copying the result fields instead of using a fragment because of https://github.com/apollostack/apollo-client/issues/451
const mapMutationsToProps = ({ ownProps }) => ({
  createUploadUrl: () => ({
    mutation: gql`
      mutation createUrl($organizationId: ID!) {
        createPresignedUploadUrl(organizationId: $organizationId)
      }
    `,
    variables: { organizationId: ownProps.organizationId }
  }),
  createOrUpdateCampaign: (contactsS3Key, contactFileName, shiftingEnabled) => {
    const shiftingConfiguration = JSON.stringify({ enabled: shiftingEnabled });
    if (ownProps.copyFrom) {
      return {
        mutation: gql`
          mutation copyCampaign(
            $campaignId: String!
            $contactsS3Key: String!
            $contactFileName: String!
            $shiftingConfiguration: String!
          ) {
            copyCampaign(
              id: $campaignId
              contactsS3Key: $contactsS3Key
              contactFileName: $contactFileName
              shiftingConfiguration: $shiftingConfiguration
            ) {
              id
            }
          }
        `,
        variables: {
          campaignId: ownProps.copyFrom,
          contactsS3Key,
          contactFileName,
          shiftingConfiguration
        }
      };
    }

    if (ownProps.updateCampaign) {
      return {
        mutation: gql`
          mutation uploadContacts(
            $campaignId: String!
            $contactsS3Key: String!
            $contactFileName: String!
            $shiftingConfiguration: String!
          ) {
            uploadContacts(
              campaignId: $campaignId
              s3Key: $contactsS3Key
              contactFileName: $contactFileName
            )
            editCampaign(
              id: $campaignId
              campaign: { shiftingConfiguration: $shiftingConfiguration }
            ) {
              id
            }
          }
        `,
        variables: {
          campaignId: ownProps.updateCampaign,
          contactsS3Key,
          contactFileName,
          shiftingConfiguration
        },
        refetchQueries: ["getCampaign"]
      };
    }

    return {
      mutation: gql`
        mutation createCampaign(
          $organizationId: String!
          $contactsS3Key: String!
          $contactFileName: String!
          $shiftingConfiguration: String!
        ) {
          createCampaign(
            campaign: {
              title: "New Campaign"
              organizationId: $organizationId
              shiftingConfiguration: $shiftingConfiguration
            }
            contactsS3Key: $contactsS3Key
            contactFileName: $contactFileName
          ) {
            id
          }
        }
      `,
      variables: {
        organizationId: ownProps.organizationId,
        contactsS3Key,
        contactFileName,
        shiftingConfiguration
      }
    };
  }
});

const mapQueriesToProps = ({ ownProps }) => {
  const queries = {
    organization: {
      query: gql`
        query getOrganization($organizationId: String!) {
          organization(id: $organizationId) {
            id
            maxContacts
          }
        }
      `,
      variables: {
        organizationId: ownProps.organizationId
      }
    }
  };

  if (ownProps.copyFrom) {
    queries.copiedCampaign = {
      query: gql`
        query getCampaign($campaignId: String!) {
          campaign(id: $campaignId) {
            id
            title
            shiftingConfiguration
          }
        }
      `,
      variables: {
        campaignId: ownProps.copyFrom
      }
    };
  }

  return queries;
};

export const CreateContainer = loadData(wrapMutations(Component), {
  mapMutationsToProps,
  mapQueriesToProps
});

export default withRouter(({ router, location, params }) => (
  <CreateContainer
    organizationId={params.organizationId}
    copyFrom={location.query.copy}
    router={router}
  />
));
