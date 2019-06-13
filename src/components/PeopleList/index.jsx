
import React, { Component } from 'react'
import type from 'prop-types'
import FlatButton from 'material-ui/FlatButton'
import ActionOpenInNew from 'material-ui/svg-icons/action/open-in-new'
import loadData from '../../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../../components/LoadingIndicator'
import DataTables from 'material-ui-datatables'


const prepareDataTableData = (users) => users.map(user => ({
  texter: user.displayName,
  email: user.email
})
)

export class PeopleList extends Component {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  componentDidUpdate = (prevProps) => {
  }

  prepareTableColumns = () => [
    {
      key: 'texter',
      label: 'Texter',
      style: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'pre-line'
      }
    },
    {
      key: 'email',
      label: 'Email',
      style: {
        textOverflow: 'ellipsis',
        overflow: 'scroll',
        whiteSpace: 'pre-line'
      }
    }
  ]

  handleNextPageClick = () => {
    const { limit, offset, total } = this.props.users.people.pageInfo
    const currentPage = Math.floor(offset / limit)
    const maxPage = Math.floor(total / limit)
    const newPage = Math.min(maxPage, currentPage + 1)
    this.props.onPageChanged(newPage)
  }

  handlePreviousPageClick = () => {
    const { limit, offset } = this.props.users.people.pageInfo
    const currentPage = Math.floor(offset / limit)
    const newPage = Math.max(0, currentPage - 1)
    this.props.onPageChanged(newPage)
  }

  handleRowSizeChanged = (index, value) => {
    this.props.onPageSizeChanged(value)
  }

  render() {
    if (this.props.users.loading) {
      return <LoadingIndicator />
    }

    const { users, pageInfo } = this.props.users.people
    const { limit, offset, total } = pageInfo
    const displayPage = Math.floor(offset / limit) + 1
    const tableData = prepareDataTableData(users)
    return (
      <div>
        <DataTables
          data={tableData}
          columns={this.prepareTableColumns()}
          page={displayPage}
          rowSize={limit}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
        />
      </div>
    )
  }
}

PeopleList.propTypes = {
  organizationId: type.string,
  cursor: type.object,
  campaignsFilter: type.object,
  onPageChanged: type.func,
  onPageSizeChanged: type.func,
  utc: type.string,
  users: type.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  users: {
    query: gql`
        query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
        $sortBy: SortPeopleBy
        ) {
            people(
                organizationId: $organizationId
                cursor: $cursor
                campaignsFilter: $campaignsFilter
                sortBy: $sortBy
            ) {
                ...on PaginatedUsers {
                    pageInfo {
                        offset
                        limit
                        total
                    }
                    users {
                        id
                        displayName
                        email
                        roles(organizationId: $organizationId)
                    }
                }
            }
        }
    `,
    variables: {
      cursor: ownProps.cursor,
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      sortBy: ownProps.sortBy || 'FIRST_NAME'
    },
    forceFetch: true
  }
})


export default loadData(withRouter(PeopleList), { mapQueriesToProps })
