import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
} from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";

export default function LinksSubpage({ userID }) {
  const [links, setLinks] = useState([]);
  const [linkIndex, setLinkIndex] = useState(-1);

  const handleLinkSelect = (event) => {
    setLinkIndex(event.target.value);
  };

  useEffect(() => {
    const unsubscribe = fetchMyLinks(userID, setLinks);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header flex justify-start">
        <Typography variant="h3" color="primary">
          Links
        </Typography>
        <Box className="padding-left-medium">
          <Select
            value={linkIndex}
            onChange={handleLinkSelect}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={-1} disabled>
              <Typography color="textSecondary">select a link</Typography>
            </MenuItem>
            {links.map((link, linkIndex) => (
              <MenuItem key={link.id} value={linkIndex}>
                {link.title}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {linkIndex < 0 ? (
        <Box className="flex please-select-item">
          <Typography color="primary">(please select a link)</Typography>
        </Box>
      ) : null}

      <Box className="link-iframe-area flex-column align-center">
        <iframe
          title="Embedded Link Media"
          width="80%"
          height="85%"
          src={links[linkIndex]?.url}
          frameBorder="0"
          allow="accelerometer; gyroscope; fullscreen; clipboard-write; clipboard-read; encrypted-media;"
        ></iframe>

        {linkIndex >= 0 ? (
          <Box className="link-details-card-container">
            <Card
              className="link-details-card"
              style={{ backgroundColor: "rgba(245, 245, 245, 0.5)" }}
            >
              <CardContent>
                <Box className="link-title">
                  <Typography display="inline" variant="h5">
                    {links[linkIndex]?.title}
                  </Typography>
                </Box>
                <Box className="link-details-vertical-divider">
                  <Typography
                    display="inline"
                    variant="h5"
                    color="textSecondary"
                  >
                    |
                  </Typography>
                </Box>

                <Box className="link-url">
                  <Typography
                    display="inline"
                    variant="subtitle1"
                    color="textSecondary"
                  >
                    {links[linkIndex]?.url}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function fetchMyLinks(userID, setLinks) {
  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls");
  ref.onSnapshot((querySnapshot) => {
    const fetchedItems = [];
    querySnapshot.forEach((doc) => {
      fetchedItems.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    setLinks((prevState) => fetchedItems);
  });
}
