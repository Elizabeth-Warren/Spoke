import { css, StyleSheet } from 'aphrodite'
import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import FlagIcon from 'material-ui/svg-icons/content/flag'
import theme from '../../../styles/theme'
import Avatar from 'material-ui/Avatar'

const styles = StyleSheet.create({
  conversationRow: {
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'normal',
    marginLeft: undefined,
    marginRight: undefined,
    backgroundColor: theme.colors.red,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'

  },
  text: {
    marginLeft: '10px'

  },
  when: {
    fontSize: theme.text.body.fontSize - 2
  }
})

const Tag = (props) =>
  <p key={props.index} className={css(styles.conversationRow)}>
    <Avatar
      backgroundColor={theme.colors.red}
    >
      <FlagIcon
        color='white'
      />
    </Avatar>
    <div className={css(styles.text)}>
      {props.tag.tag}
      <br />
      <span className={css(styles.when)}>
        {moment(props.tag.createdAt).fromNow()} -- {props.tag.createdBy.displayName}
      </span>
   </div>
  </p>

Tag.propTypes = {
  tag: PropTypes.object,
  index: PropTypes.number
}

export default Tag
