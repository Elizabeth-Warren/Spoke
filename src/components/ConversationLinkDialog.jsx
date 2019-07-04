import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'material-ui/Dialog'
import ConversationLink from '../components/ConversationLink'
import FlatButton from 'material-ui/FlatButton'
import { dataTest } from '../lib/attributes'

const ConversationLinkDialoag = (props) => (
  <Dialog
    title='Link To This Conversation'
    actions={[
      <FlatButton
        {...dataTest('convoLinkOK')}
        label='OK'
        primary
        onTouchTap={props.requestClose}
      />
    ]}
    modal={false}
    open={props.open}
    onRequestClose={props.requestClose}
  >
    <ConversationLink
      organizationId={props.organizationId}
      conversation={props.conversation}
      text={props.text}
    />
  </Dialog>
)

ConversationLinkDialoag.propTypes = {
  open: PropTypes.bool,
  requestClose: PropTypes.func,
  conversation: PropTypes.object,
  organizationId: PropTypes.string,
  text: PropTypes.text
}


export default ConversationLinkDialoag
