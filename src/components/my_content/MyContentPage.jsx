import React, { useState, useEffect } from "react";
import { Box } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import MainNavBar from "../MainNavBar.jsx";
import QuestionSubpage from "./QuestionSubpage.jsx";
import DocumentsSubpage from "./DocumentsSubpage.jsx";
import ImagesSubpage from "./ImagesSubpage.jsx";
import LinksSubpage from "./LinksSubpage.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { fetchUserInfo } from "../../app/firestoreClient.js";

const { MyContentTheme } = require("../../themesKoral.js");

export default function MyContentPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const subpages = ["Questions", "Documents", "Images", "Links"];
  const subpage = subpages[selectedIndex];
  const { currentUser } = useAuth();
  const userID = currentUser.uid;
  const userEmail = currentUser.email;
  const userDisplayName = currentUser.displayName;
  const [userInfo, setUserInfo] = useState({});
  const userPermissions = userInfo.permissions;

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  useEffect(() => {
    const unsubscribe = fetchUserInfo(userID, setUserInfo);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={MyContentTheme}>
      <div className="page-background my-content-background">
        <MainNavBar />
        <Drawer variant="permanent">
          <List style={{ width: "160px" }} component="nav">
            <Box className="side-nav-spacer" />
            <ListItem>
              <ListItemText primary="MY CONTENT" />
            </ListItem>
            {subpages.map((subpage, index) => (
              <ListItem
                button
                key={`myContent${subpage}`}
                selected={selectedIndex === index}
                style={
                  selectedIndex === index
                    ? { backgroundColor: "#FCEFE0" }
                    : null
                }
                onClick={(event) => handleListItemClick(event, index)}
              >
                <ListItemText
                  style={{ paddingLeft: "35px" }}
                  inset
                  primary={subpage}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>

        {subpage === "Questions" && (
          <QuestionSubpage
            userDisplayName={userDisplayName}
            userEmail={userEmail}
            userID={userID}
            userPermissions={userPermissions}
          />
        )}

        {subpage === "Documents" && <DocumentsSubpage userID={userID} />}

        {subpage === "Images" && <ImagesSubpage userID={userID} />}

        {subpage === "Links" && <LinksSubpage userID={userID} />}
      </div>
    </ThemeProvider>
  );
}
