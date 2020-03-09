import React from "react";
import { GraphQLRequestError, graphQLErrorParser } from "../../network/errors";

const wrapMutations = Component => props => {
  const newProps = { ...props };
  if (props.hasOwnProperty("mutations")) {
    const newMutations = {};
    // eslint-disable-next-line react/prop-types
    Object.keys(props.mutations).forEach(key => {
      newMutations[key] = async (...args) => {
        const argCopy = [...args];
        // eslint-disable-next-line react/prop-types
        const resp = await props.mutations[key](...argCopy);
        console.log("RESP", resp);
        const parsedError = graphQLErrorParser(resp);
        console.log("PARSED ERROR", parsedError);
        if (parsedError) {
          console.log("THROWING");
          throw new GraphQLRequestError(parsedError);
        }
        return resp;
      };
    });
    newProps.mutations = newMutations;
  }
  return <Component {...newProps} />;
};

export default wrapMutations;
