import types from "prop-types";
import React, {useState, useEffect} from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import TextField from "material-ui/TextField";
import AutoComplete from "material-ui/AutoComplete";
import LabelChips from "../components/LabelChips";
import RaisedButton from "material-ui/RaisedButton";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import theme from "src/styles/theme";
import { getGraphQLErrors } from "src/client/lib/error-helpers";
import DataTables from "material-ui-datatables";
import CheckIcon from "material-ui/svg-icons/action/check-circle";

let AreaCodes = require('areacodes');
let areaCodes = new AreaCodes();

//JS TODO
//add state to table
//add search for table
//sortable by column
// Another useful tool: Type in a list of area codes and automatically sum up how many are available / reserved / quiet / OR assigned - talk to Nora about vision here
// This should take contacts / 200(env arg ?) and find the number of phone numbers needed.Then take into account any available phone numbers we have.

function AdminPhoneNumbers(props) {

  const [loading, setIsloading] = useState(false)
  const [contactCount, setContactCount] = useState("");
  const [areaCodeInput, setAreaCodeInput] = useState("");
  const [areaCodesToBuy, setAreaCodesToBuy] = useState([]);
  const [areaCodeOptions, setAreaCodeArray] = useState([]);
  const [numberErrors, setNumberErrors] = useState([]);
  const [purchasedNumbers, setPurchased] = useState([])


  const columns = [
    {
      key: "areaCode",
      label: "Area Code",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "assignedCount",
      label: "Assigned",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "reservedCount",
      label: "Reserved",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      },
    },
    {
      key: "availableCount",
      label: "Available",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      },
    }
  ];


  if (!props.organizationData.organization) {
    return null;
  }

    const handleContactCountChange = (e) =>  setContactCount(e.target.value);
    const handleAreaCodeInputChange = (text) => setAreaCodeInput(text)

    const handleBuyNumbers = async () => {  
      setIsloading(true)
      const limit = Math.ceil(contactCount / window.CONTACTS_PER_PHONE_NUMBER);
      let purchasedByAreaCode = []
      const totalPurchased = purchasedByAreaCode.reduce((acc, entry) => acc + entry.purchased, 0);

    for (let i = 0; i < areaCodesToBuy.length; i++) {
      if (totalPurchased < limit) {
        const { areaCode } = areaCodesToBuy[i];
        const numbersToBuy = limit - totalPurchased;
        const res = await props.mutations.buyTwilioPhoneNumbers(areaCode, numbersToBuy);
        const { data, errors } = res;

        if (errors) {
          const graphQLErrors = getGraphQLErrors(res).map(item => item.message) || [];
          if (!!graphQLErrors.length){
            setNumberErrors([...numberErrors, ...graphQLErrors]);
          }
          else {
            setNumberErrors([...numberErrors, ...errors.message]);

          }
        } 
        else {
          const { progress } = data.buyNumbers
          purchasedByAreaCode.push({ areaCode, purchased: progress })
        }
      }
    }

    setAreaCodesToBuy([])
    setContactCount("")
    setPurchased(purchasedByAreaCode)
  }


  // function handleFilterValueChange() {
  // }
  

  // function handleSortOrderChange() {
  // }

  useEffect(() => {
    if (!areaCodeOptions.length) {
      areaCodes.getAll((err, data) => {
        if (data) {
          const array = Object.keys(data).map(obj => {
            const { city, state } = data[obj]
            const areaCode = obj;
            const displayValue = `${areaCode} (${city}, ${state})`
            return {
              areaCode,
              displayValue
            }
          })
          setAreaCodeArray(array);
        }
        else {
          console.error(err);
        }
      });
    }
  }, [])

  const allAreaCodes = areaCodeOptions.filter(
    x => !areaCodesToBuy.find(z => z.areaCode === x.areaCode)
  );

  function selectNewAreaCode(selection, index) {
    let newSelection;
    if (typeof selection === "object") {
      newSelection = selection;
    }
    else if (index === -1) {
      newSelection = allAreaCodes.find(item => item.areaCode === selection);
    }
    if (newSelection) {
      setAreaCodesToBuy([...areaCodesToBuy, newSelection])
      setAreaCodeInput("");
    }
  }

  const allNumbers = props.organizationData.organization.phoneNumbersByStatus;
  const userRoles = props.userData.currentUser.roles;
  const isSuperUser = userRoles.includes("SUPERADMIN")
  // const isSuperUser = true;

  return (
    <div>
      {
        isSuperUser && (
          <div>
          <h2>Buy Numbers</h2>
          <div>
            <TextField
              name="Number of Contacts"
              autoFocus
              value={contactCount}
              onChange={handleContactCountChange}
              hintText="number of contacts"
              type="number"
            />
          </div>
          <div>Numbers to buy: {Math.ceil(contactCount / window.CONTACTS_PER_PHONE_NUMBER)} </div>
          <div>
            <AutoComplete
              hintText="area code"
              searchText={areaCodeInput}
              onUpdateInput={handleAreaCodeInputChange}
              dataSource={allAreaCodes}
              maxSearchResults={3}
              onNewRequest={selectNewAreaCode}
              dataSourceConfig={{
                text: "displayValue",
                value: "areaCode"
              }}
            />
            <LabelChips
              labels={areaCodesToBuy}
              keyBy="areaCode"
              labelIds={areaCodesToBuy.map(item => item.areaCode)}
              onRequestDelete={areaCodeChip => {
                const newAreaCodesToBuy = areaCodesToBuy.filter(obj => obj.areaCode !== areaCodeChip.areaCode)
                setAreaCodesToBuy(newAreaCodesToBuy)
              }}
            />
          </div>
          <RaisedButton
            disabled={loading || !areaCodesToBuy.length || !areaCodesToBuy.length}
            label={loading ? "Buying" : "Buy!"}
            onClick={handleBuyNumbers}
          />
          
              <h4>Results</h4>
              {
                numberErrors.map(error => (
                  <span key={error} style={{ display: "flex", alignItems: "center" }}>
                    <ErrorIcon color={theme.colors.red} />
                    {error}
                  </span>
                ))
                } {
              purchasedNumbers.map(areaCode => (

                <span key={areaCode} style={{ display: "flex", alignItems: "center" }}>
                  <CheckIcon color={theme.colors.EWdarkLibertyGreen} />
                  {`Purchased ${areaCode.purchased} ${areaCode.areaCode} numbers`}
                </span>
              ))
                    }
            </div>
        )
      }  
      <div>
          <h2>All Numbers</h2>
          <DataTables
            data={allNumbers}
            columns={columns}
            count={allNumbers.length}
            showRowHover={true}
            showFooterToolbar={false}


          // onFilterValueChange={handleFilterValueChange}
          // onSortOrderChange={handleSortOrderChange}
          />
        </div>
    </div>
   );
}

AdminPhoneNumbers.propTypes = {
  organizationData: types.object,
  userData: types.object
};

const mapMutationsToProps = () => ({
  buyTwilioPhoneNumbers: (areaCode, limit, areaCodes) => ({
    mutation: gql`
      mutation buyNumbers($areaCode: String!, $limit: Int!, $areaCodes: [String!] ) {
        buyNumbers(areaCode: $areaCode, limit: $limit, areaCodes: $areaCodes) {
          id
          resultMessage
          progress
          status
        }
      }
    `,
    variables: {
      areaCode,
      limit
    },
  })
});

const mapQueriesToProps = ({ ownProps }) => ({

  userData: {
    query: gql`
      query getCurrentUserRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  },
  organizationData: {
    query: gql`
      query getOrganization($organizationId: String!) {
        organization(id: $organizationId) {
          id
          phoneNumbersByStatus {
            areaCode
            availableCount
            reservedCount
            assignedCount
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
});

export default loadData(AdminPhoneNumbers, { mapQueriesToProps, mapMutationsToProps });