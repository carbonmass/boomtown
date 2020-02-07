import React from "react";
import { withStyles } from "@material-ui/core/styles";
import styles from "./styles";
import Gravatar from "react-gravatar";
import ItemsGrid from "../../components/ItemsGrid";

const Profile = ({ userData, classes }) => {
  return (
    <div className={classes.profileContainer}>
      <div className={classes.itemsSharedContainer}>
        <Gravatar
          email={userData.email}
          className={classes.gravatar}
          size={50}
          rating="pg"
          default="monsterid"
          style={{ borderRadius: 50, marginRight: 20 }}
        />
        <div className={classes.userName}>{userData.fullname}</div>

        <div className={classes.userData}></div>
        <div className={classes.bold}>
          {userData.items.length} Items shared
          <div className={classes.bold}>
            {userData.borrowed.length} Items borrowed
          </div>
        </div>

        <div className={classes.usersBio}>
          {userData.bio ? userData.bio : null}
        </div>
      </div>
      <h1 className={classes.sharedItemsTitle}>Shared Items</h1>
      <ItemsGrid items={userData.items} />
    </div>
  );
};

export default withStyles(styles)(Profile);
