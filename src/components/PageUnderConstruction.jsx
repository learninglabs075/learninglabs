import React from "react";
import { Box } from "@material-ui/core";
import { Typography } from "@material-ui/core";

export default function PageUnderConstructionSubpage(props) {
  return (
    <Box className="display-area flex-column">
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box padding={5}>
          <Typography variant="h5" color="primary">
            Page Under Construction
          </Typography>
        </Box>
        <Box>
          <img
            width={100}
            src="https://firebasestorage.googleapis.com/v0/b/koral-community-development.appspot.com/o/public%2FMoreBrilliantTomorrow.png?alt=media&token=59521353-7f8c-4f05-b948-3da9c89bc1ad"
            alt="hand holding lightbulb"
          />
        </Box>

        <Box padding={5}>
          <Typography variant="subtitle1" color="textSecondary">
            Please excuse us while we build a more brilliant tomorrow
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
