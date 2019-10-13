import PropTypes from 'prop-types'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'

import FlagIcon from 'material-ui/svg-icons/content/flag'
import FlatButton from 'material-ui/FlatButton'

import TagsDialog from './TagsDialog'

const styles = StyleSheet.create({
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
    marginTop: '3px',
    marginRight: '10px'
  }
})


class Tags extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      open: false
    }
  }

  handleOpenDialog = () => {
    this.setState({ open: true })
  }

  dialogCloseRequested = () => {
    this.setState({ open: false })
  }

  renderButton = () => (
    <FlatButton
      className={css(styles.button)}
      onTouchTap={this.handleOpenDialog}
      style
    >
      <FlagIcon
        color='white'
      />
    </FlatButton>
  )

  renderDialog = () => (
    <TagsDialog
      open={this.state.open}
      closeRequested={this.dialogCloseRequested}
      {...this.props}
    />
  )

  render = () => (
    <div>
      {this.props.campaignContact.hasUnresolvedTags && this.renderButton()}
      {this.state.open && this.renderDialog()}
    </div>
  )
}

Tags.propTypes = {
  campaign: PropTypes.object,
  campaignContact: PropTypes.object,
  assignment: PropTypes.object
}

export default Tags
