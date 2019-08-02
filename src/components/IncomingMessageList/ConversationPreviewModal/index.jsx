import React, { Component } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import loadData from '../../../containers/hoc/load-data'
import wrapMutations from '../../../containers/hoc/wrap-mutations'
import ConversationLinkDialog from '../../ConversationLinkDialog'
import ConversationPreviewBody from './Body'

class ConversationPreviewModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      optOutError: '',
      conversationLinkDialogOpen: false
    }
  }

  handleClickLink = () => {
    this.setState({ conversationLinkDialogOpen: true })
  }

  handleCloseLinkRequested = () => {
    this.setState({ conversationLinkDialogOpen: false })
  }

  handleClickOptOut = async () => {
    const { contactNumber, assignmentId, campaignContactId } = this.props.conversation
    const optOut = {
      cell: contactNumber,
      assignmentId
    }
    try {
      const response = await this.props.mutations.createOptOut(optOut, campaignContactId)
      if (response.errors) {
        let errorText = 'Error processing opt-out.'
        if ('message' in response.errors) {
          errorText = response.errors.message
        }
        throw new Error(errorText)
      }
      this.props.onForceRefresh()
      this.props.onRequestClose()
    } catch (error) {
      this.setState({ optOutError: error.message })
    }
  }

  render() {
    const { conversation } = this.props
    const isOpen = conversation !== undefined

    const primaryActions = [
      <FlatButton
        label='Link'
        secondary
        onClick={this.handleClickLink}
      />,
      <FlatButton
        label='Opt-Out'
        secondary
        onClick={this.handleClickOptOut}
      />,
      <FlatButton
        label='Close'
        primary
        onClick={this.props.onRequestClose}
      />
    ]

    return (
      <div>
        <Dialog
          title='Messages'
          open={isOpen}
          actions={primaryActions}
          modal={false}
          onRequestClose={this.props.onRequestClose}
        >
          <div>
            {isOpen && <ConversationPreviewBody {...this.props} />}
            <Dialog
              title='Error Opting Out'
              open={!!this.state.optOutError}
              modal={false}
            >
              <p>{this.state.optOutError}</p>
            </Dialog>
          </div>
        </Dialog>
        <ConversationLinkDialog
          open={this.state.conversationLinkDialogOpen}
          requestClose={this.handleCloseLinkRequested}
          conversation={this.props.conversation}
          organizationId={this.props.organizationId}
          text="Copy this link and send it to someone you want to look at this conversation.  The texter to whom it's currently assigned and any user who is at least a supervolunteer will be able to see the conversation."
        />
      </div>
    )
  }
}

ConversationPreviewModal.propTypes = {
  organizationId: PropTypes.string,
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func,
  mutations: PropTypes.object,
  onForceRefresh: PropTypes.func
}

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut($optOut: OptOutInput!, $campaignContactId: String!) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  })
})

export default loadData(wrapMutations(ConversationPreviewModal), {
  mapMutationsToProps
})
