import { css, StyleSheet } from 'aphrodite'
import DataTables, { DataTableProps } from 'material-ui-datatables'
import type from 'prop-types'
import React from 'react'
import TableToolbar from './TableToolbar'


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  }
})

const DualNavDataTables = (props) => (
  <div
    className={css(styles.container)}
  >
    {props.toolbarTop && (<TableToolbar
      page={props.page}
      rowSize={props.rowSize}
      count={props.count}
      onNextPageClick={props.onNextPageClick}
      onPreviousPageClick={props.onPreviousPageClick}
      onRowSizeChange={props.onRowSizeChange}
      borderBottom
    />)}
    <DataTables
      {...props}
      showFooterToolbar={false}
    />
    {props.toolbarBottom && (<TableToolbar
      page={props.page}
      rowSize={props.rowSize}
      count={props.count}
      onNextPageClick={props.onNextPageClick}
      onPreviousPageClick={props.onPreviousPageClick}
      onRowSizeChange={props.onRowSizeChange}
      borderTop
    />)}
  </div>
)

DualNavDataTables.propTypes = {
  ...DataTableProps,
  toolbarTop: type.bool,
  toolbarBottom: type.bool
}


export default DualNavDataTables
