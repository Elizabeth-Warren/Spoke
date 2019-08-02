import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import loadData from '../../containers/hoc/load-data'

import FlagIcon from 'material-ui/svg-icons/content/flag'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import Theme from '../../styles/theme'

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
      style
    >
      <FlagIcon
        color='white'
      />
    </FlatButton>
  )

  renderDialog = () => (
    <Dialog
      title='Tags'
      open={this.state.open}
      actions={this.dialogActions}
      modal
    >
      <div
        className={css(styles.container)}
      >
        <List>
          {this.props.conversations.conversations.conversations[0].contact.tags.map((tag, index) =>
            (<ListItem
              key={index}
            >
              <span style={Theme.text.body}>
                {`${tag.tag} `}
              </span>
              <span style={Object.assign({}, Theme.text.body, { fontSize: Theme.text.body.fontSize * 0.8, fontStyle: 'italic' })}>
                {`${moment(tag.createdAt).format('lll')}`}
              </span>
            </ListItem>)
          )}
        </List>
      </div>
    </Dialog>
  )

  render = () => (
    <div>
      {this.props.campaignContact.hasUnresolvedTags && this.renderButton()}
      {this.state.open && this.renderDialog()}
    </div>
  )
}

Tags.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  campaignContact: PropTypes.object,
  assignment: PropTypes.object,
  conversations: PropTypes.object
}


const mapQueriesToProps = ({ ownProps }) => ({
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $cursor: OffsetLimitCursor!
        $contactsFilter: ContactsFilter
      ) {
        conversations(
          cursor: $cursor
          organizationId: $organizationId
          contactsFilter: $contactsFilter
        ) {
          pageInfo {
            limit
            offset
            total
          }
          conversations {
            contact {
              tags {
                tag
                createdAt
                createdBy {
                  displayName
                }
                resolvedAt
                resolvedBy {
                  displayName
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.campaign.organization.id,
      cursor: { offset: 0, limit: 1 },
      contactsFilter: { contactId: ownProps.campaignContact.id }
    },
    forceFetch: true
  }
})

export default loadData(Tags, { mapQueriesToProps })
