import React from "react";
import { connect } from "react-apollo";
import LoadingIndicator from "../../components/LoadingIndicator";

const loadData = (Component, connectArgs, { showTraceLog = false } = {}) => {
  function traceLog(...args) {
    if (showTraceLog) {
      console.log(...args);
    }
  }

  class LoadData extends React.Component {
    constructor(props) {
      super(props);
      traceLog("CONSTRUCTOR", this.dataProps(props));

      const isLoading = this.isLoading(props);
      this.state = {
        isLoading,
        lastReceivedData: isLoading ? {} : this.dataProps(props)
      };
    }

    // This ensures that the loading
    // indicator only shows on the first
    // load and not when refetch is called
    componentWillReceiveProps(props) {
      traceLog("PROPS", this.dataProps(props));

      const isLoading = this.isLoading(props);

      if (this.state.isLoading && !isLoading) {
        this.setState({
          isLoading: false
        });
      }

      if (!isLoading) {
        this.setState({
          lastReceivedData: this.dataProps(props)
        });
      }
    }

    dataProps(props) {
      const newProps = {};
      Object.keys(props).forEach(propName => {
        const prop = props[propName];
        if (
          prop &&
          prop.hasOwnProperty("loading") &&
          prop.hasOwnProperty("errors") &&
          prop.hasOwnProperty("refetch")
        ) {
          newProps[propName] = prop;
        }
      });
      traceLog(props, newProps);
      return newProps;
    }

    isLoading(props) {
      let isLoading = false;
      Object.keys(this.dataProps(props)).forEach(propName => {
        if (props[propName].loading) {
          isLoading = true;
        }
      });
      return isLoading;
    }

    render() {
      const dataProps = this.dataProps(this.props);
      Object.keys(dataProps).forEach(prop => {
        if (dataProps[prop].errors) {
          console.error("ERROR IN REQUEST", dataProps[prop].errors);
        }
      });

      if (this.state.isLoading) {
        traceLog("LOADING");
        return <LoadingIndicator />;
      }

      traceLog("RENDERING", this.props, this.state.lastReceivedData);
      return <Component {...this.props} {...this.state.lastReceivedData} />;
    }
  }

  return connect(connectArgs)(LoadData);
};

export default loadData;
