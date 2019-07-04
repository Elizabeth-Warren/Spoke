import PropTypes, { arrayOf } from 'prop-types'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'

import ActionInfoOutline from 'material-ui/svg-icons/action/info-outline'
import IconButton from 'material-ui/IconButton'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ConversationLink from '../../components/ConversationLink'

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  conversationLink: {
    paddingTop: '25px'
  },
  button: {
    backgroundColor: 'blue',
    width: '28px',
    minWidth: '28px',
    minHeight: '28px',
    height: '28px',
    paddingTop: '2px',
    marginTop: '3px'
  }
})


export default class ContactInfo extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      open: false
    }
  }

  dialogActions = <FlatButton
    label='Close'
    primary
    onClick={() => this.handleCloseDialog()}
  />

  handleCloseDialog = () => {
    this.setState({ open: false })
  }

  handleOpenDialog = () => {
    this.setState({ open: true })
  }

  renderButton = () => (
    <FlatButton
      className={css(styles.button)}
      onTouchTap={this.handleOpenDialog}
    >
      <ActionInfoOutline
        color='white'
      />
    </FlatButton>
  )

  renderDialog = () => (
    <Dialog
      title='Conversation Information'
      open={this.state.open}
      actions={this.dialogActions}
      modal
    >
      <div
        className={css(styles.container)}
      >
        <span>Campaign ID: {this.props.campaign.id}</span>
        <span>Assignment ID: {this.props.campaignContact.assignmentId}</span>
        <span>Campaign contact ID: {this.props.campaignContact.id}</span>
        <div
          className={css(styles.conversationLink)}
        >
          <ConversationLink
            organizationId={this.props.campaign.organization.id}
            conversation={{
              assignmentId: this.props.campaignContact.assignmentId,
              campaignContactId: this.props.campaignContact.id
            }}
            text='Conversation URL'
          />
        </div>
      </div>
    </Dialog>
  )

  render = () => (
    <div>
      {this.renderButton()}
      {this.state.open && this.renderDialog()}
    </div>
  )
}

ContactInfo.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  campaignContact: PropTypes.object
}

