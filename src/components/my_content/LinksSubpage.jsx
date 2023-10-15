import React, { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemText } from "@material-ui/core";
import { Typography, Card, CardContent } from "@material-ui/core";
import AddLink from "./AddLink.jsx";
import EditLink from "./EditLink.jsx";
import firebase from "../../app/config/firebaseConfig.js";
import { deleteLink } from "../../app/firestoreClient.js";

function trimURL(url, length) {
  if (url.length > length) {
    return url.slice(0, length - 3) + "...";
  } else {
    return url;
  }
}

export default function LinksSubpage(props) {
  const [links, setLinks] = useState([]);
  const [linkIndex, setLinkIndex] = useState(-1);

  function fetchMyLinks() {
    const ref = firebase
      .firestore()
      .collection("user_links")
      .doc(props.userID)
      .collection("urls");
    ref.orderBy("title", "asc").onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          title: doc.data().title,
          url: doc.data().url,
          description: doc.data().description,
        });
      });
      setLinks((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyLinks();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header">
        <Typography variant="h3" color="primary">
          Links
        </Typography>
      </Box>
      <Box className="flex-row link-subdisplay-area">
        <Box className="link-list-container">
          <List component="nav">
            {links.map((link, index) => (
              <div className="relative">
                <ListItem
                  key={link.id}
                  onClick={(prevIndex) => setLinkIndex(index)}
                  button
                >
                  {link.title === "" && (
                    <ListItemText primary="(no title)" secondary={link.url} />
                  )}
                  {link.title !== "" && (
                    <ListItemText
                      primary={link.title}
                      secondary={trimURL(link.url, 40)}
                    />
                  )}
                </ListItem>
                <button
                  className="delete-button delete-link-button hover-pointer-default"
                  onClick={() => {
                    setLinkIndex(-1);
                    deleteLink(link.id, props.userID);
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </List>
          <Box className="add-link-btn">
            <AddLink userID={props.userID} />
          </Box>
        </Box>

        {linkIndex >= 0 && (
          <Box className="flex-column" width="50vw" height="70vh">
            <iframe
              title="Embedded Link Media"
              width="100%"
              height="100%"
              src={links[linkIndex]?.url}
              frameBorder="0"
              allow="accelerometer; gyroscope; fullscreen; clipboard-write; clipboard-read; encrypted-media;"
            ></iframe>
            <Box className="link-description-card-container relative">
              <Box className="absolute" style={{ right: "10px", top: "10px" }}>
                <EditLink linkInfo={links[linkIndex]} userID={props.userID} />
              </Box>
              <Card
                style={{
                  backgroundColor: "rgba(245, 245, 245, 0.5)",
                  width: "100%",
                }}
              >
                <CardContent>
                  <Typography variant="h5">
                    {links[linkIndex]?.title}
                  </Typography>
                  <Typography variant="subtitle1">
                    {links[linkIndex]?.description}
                  </Typography>
                  <Typography variant="subtilte1" color="textSecondary">
                    {links[linkIndex]?.url}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
        {linkIndex < 0 && (
          <Box className="flex-center-all no-link-selected">
            <Typography color="textSecondary">(no link selected)</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
