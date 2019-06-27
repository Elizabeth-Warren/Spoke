import { css, StyleSheet } from 'aphrodite'
import DataTables, { DataTableProps } from 'material-ui-datatables'
import type from 'prop-types'
import React from 'react'
import TableToolbar from './TableToolbar'
import _ from 'lodash'


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  }
})

const dualNavDataTypesOnPropTypes = {
  toolbarTop: type.bool,
  toolbarBottom: type.bool
}

const filterDataTablesProps = (props) =>
  _.pickBy(props, (value, key) => !(key in dualNavDataTypesOnPropTypes))


const DualNavDataTables = (props) => (
  <div
    className={css(styles.container)}
  >
    {props.toolbarTop && (<TableToolbar
      page={props.page}
      rowSize={props.rowSize}
      rowSizeList={props.rowSizeList}
      count={props.count}
      onNextPageClick={props.onNextPageClick}
      onPreviousPageClick={props.onPreviousPageClick}
      onRowSizeChange={props.onRowSizeChange}
      borderBottom
    />)}
    <DataTables
      {...filterDataTablesProps(props)}
      showFooterToolbar={false}
    />
    {props.toolbarBottom && (<TableToolbar
      page={props.page}
      rowSize={props.rowSize}
      rowSizeList={props.rowSizeList}
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
  ...dualNavDataTypesOnPropTypes
}


export default DualNavDataTables
