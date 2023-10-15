import React, { useState } from "react";
import { Box, Typography } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import { CommunityTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import PageUnderConstruction from "../PageUnderConstruction";
// import BrowseSubpage from "./BrowseSubpage.jsx";
// import ShareSubpage from "./ShareSubpage.jsx";

export default function CommunityPage() {
  const [selectedIndex, setSelectedIndex] = useState("");
  const [subpage, setSubpage] = useState("");
  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
    setSubpage(index);
  };
  return (
    <ThemeProvider theme={CommunityTheme}>
      <div className="page-background community-background">
        <MainNavBar />
        <Drawer variant="permanent">
          <List style={{ width: "160px" }} component="nav">
            <Box className="side-nav-spacer" />
            <ListItem>
              <ListItemText primary="COMMUNITY" />
            </ListItem>
            <ListItem
              button
              selected={selectedIndex === "Browse"}
              onClick={(event) => handleListItemClick(event, "Browse")}
            >
              <ListItemText
                style={{ paddingLeft: "35px" }}
                inset
                primary="Browse"
              />
            </ListItem>
            <ListItem
              button
              selected={selectedIndex === "Share"}
              onClick={(event) => handleListItemClick(event, "Share")}
            >
              <ListItemText
                style={{ paddingLeft: "35px" }}
                inset
                primary="Share"
              />
            </ListItem>
          </List>
        </Drawer>

        {subpage === "" ? (
          <Box className="flex-column quote-container">
            <Box textAlign="center">
              <Typography variant="subtitle1" color="textSecondary">
                If I cannot do great things, I can do small things in a great
                way.
              </Typography>
              <Box className="quote-attribution">
                <Typography variant="subtitle1" color="textSecondary">
                  - Martin Luther King Jr.
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : null}

        {subpage === "Browse" ? <PageUnderConstruction /> : null}

        {subpage === "Share" ? <PageUnderConstruction /> : null}
      </div>
    </ThemeProvider>
  );
}
