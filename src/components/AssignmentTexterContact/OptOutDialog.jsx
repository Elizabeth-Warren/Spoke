import { css, StyleSheet } from 'aphrodite'
import { Card, CardActions, CardTitle } from 'material-ui/Card'
import Divider from 'material-ui/Divider'
import FlatButton from 'material-ui/FlatButton'
import PropTypes from 'prop-types'
import React from 'react'
import Form from 'react-formal'
import yup from 'yup'
import GSForm from '../forms/GSForm'
import GSSubmitButton from '../forms/GSSubmitButton'

const styles = StyleSheet.create({
  optOutCard: {
    '@media(max-width: 320px)': {
      padding: '2px 10px !important'
    },
    zIndex: 2000,
    backgroundColor: 'white'
  },
  dialogActions: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
})

const inlineStyles = {
  dialogButton: {
    display: 'inline-block'
  }
}

const optOutSchema = yup.object({
  optOutMessageText: yup.string()
})

const OptOutDialog = (props) => props.open && (
  <Card>
    <CardTitle
      className={css(styles.optOutCard)}
      title='Opt out user'
    />
    <Divider />
    <CardActions className={css(styles.optOutCard)}>
      <GSForm
        className={css(styles.optOutCard)}
        schema={optOutSchema}
        onChange={({ optOutMessageText }) => props.onOptOutMessageTextChanged(optOutMessageText)}
        value={{ optOutMessageText: props.optOutMessageText }}
        onSubmit={props.onOptOut}
      >
        <Form.Field
          name='optOutMessageText'
          fullWidth
          autoFocus
          multiLine
        />
        <div className={css(styles.dialogActions)}>
          <FlatButton
            style={inlineStyles.dialogButton}
            label='Cancel'
            onTouchTap={props.onRequestClose}
          />
          <Form.Button
            type='submit'
            style={inlineStyles.dialogButton}
            component={GSSubmitButton}
            label={props.optOutMessageText.length ? 'Send' : 'Opt Out without Text'}
            disabled={props.disabled}
          />
        </div>
      </GSForm>
    </CardActions>
  </Card>
)

OptOutDialog.propTypes = {
  optOutMessageText: PropTypes.string,
  open: PropTypes.bool,
  disabled: PropTypes.bool,
  onRequestClose: PropTypes.func,
  onOptOutMessageTextChanged: PropTypes.func,
  onOptOut: PropTypes.func
}

export default OptOutDialog
