import React, { Component } from "react";
import Share from "./Share";
import { Query } from "react-apollo";
import { ALL_TAGS_QUERY } from "../../apollo/queries";
// import FullScreenLoader from '../../components/FullScreenLoader';
// Hint: query tags

class ShareContainer extends Component {
  render() {
    return (
      <Query query={ALL_TAGS_QUERY}>
        {({ loading, error, data }) => {
          // if (loading) return <FullScreenLoader />;
          if (loading) return "loading...";
          if (error) return `Error! ${error.message}`;
          if (data) return <Share tags={data.tags} />;
        }}
      </Query>
    );
  }
}

export default ShareContainer;
