import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { MyProfileTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import AccountBoxIcon from "@material-ui/icons/AccountBox";
import { useAuth } from "../../app/contexts/AuthContext.js";
import UpdateEmail from "./UpdateEmail.jsx";
import UpdateDisplayName from "./UpdateDisplayName.jsx";
import UploadProfilePicture from "./UploadProfilePicture.jsx";
import firebase from "../../app/config/firebaseConfig.js";
import DeleteIcon from "@material-ui/icons/Delete";
import { fetchUserInfo } from "../../app/firestoreClient.js";

function extractDate(dateString) {
  const dateObject = new Date(dateString);
  const tidiedDateObject = new Date(
    dateObject.getFullYear(),
    dateObject.getMonth(),
    dateObject.getDate()
  );
  return tidiedDateObject.toLocaleDateString();
}

async function deleteProfilePicture(userID, filename) {
  const pictureStorageRef = firebase
    .storage()
    .ref()
    .child(`users/${userID}/profile/${filename}`);

  const pictureFirestoreRef = firebase
    .firestore()
    .collection("users")
    .doc(userID);

  try {
    await pictureStorageRef.delete();
  } catch (error) {
    console.log("an error occurred while deleting the image");
    console.log(error.message);
  }
  try {
    await pictureFirestoreRef.update({
      profilePicture: firebase.firestore.FieldValue.delete(),
    });
  } catch (error) {
    console.log("an error ocurred while deleting the image");
    console.log(error.message);
  }
}

export default function MyProfilePage() {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState(currentUser.email);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [userInfo, setUserInfo] = useState("");
  const userID = currentUser.uid;

  useEffect(() => {
    const unsubscribe = fetchUserInfo(userID, setUserInfo);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={MyProfileTheme}>
      <div className="page-background">
        <MainNavBar />

        <Box className="display-area-full">
          <Box className="subpage-header">
            <Typography variant="h3" color="primary">
              My Profile
            </Typography>
          </Box>
          <Box className="flex-row justify-center padding-light">
            <Box className="flex-column align-center">
              {typeof userInfo.profilePicture !== "undefined" ? (
                <img
                  src={userInfo.profilePicture.url}
                  alt="my portrait"
                  className="user-uploaded-picture"
                />
              ) : (
                <AccountBoxIcon color="primary" style={{ fontSize: 220 }} />
              )}
            </Box>
            <Box className="details-container">
              <Box className="info-row">
                <Box className="info-property">
                  <Typography align="right">email: </Typography>
                </Box>
                <Box className="info-value">
                  <Typography align="left">{email}</Typography>
                </Box>
                <Box className="shift-button-position-up">
                  <UpdateEmail setEmail={setEmail} />
                </Box>
              </Box>
              <Box className="info-row">
                <Box className="info-property">
                  <Typography align="right">name: </Typography>
                </Box>
                <Box className="info-value">
                  {currentUser.displayName ? (
                    <Typography align="left">{displayName}</Typography>
                  ) : (
                    <Typography color="textSecondary">(anonymous)</Typography>
                  )}
                </Box>
                <Box className="shift-button-position-up">
                  <UpdateDisplayName
                    setDisplayName={setDisplayName}
                    userID={currentUser.uid}
                  />
                </Box>
              </Box>
              <Box className="info-row">
                <Box className="info-property">
                  <Typography align="right">profile picture: </Typography>
                </Box>
                <Box className="info-value">
                  {typeof userInfo.profilePicture !== "undefined" ? (
                    <Typography align="left">
                      {userInfo.profilePicture.name}
                    </Typography>
                  ) : (
                    <Typography align="left" color="textSecondary">
                      (no picture uploaded)
                    </Typography>
                  )}
                </Box>
                <Box className="shift-button-position-up">
                  {typeof userInfo.profilePicture !== "undefined" ? (
                    <Button
                      style={{ color: "gray" }}
                      startIcon={<DeleteIcon />}
                      onClick={() =>
                        deleteProfilePicture(
                          currentUser.uid,
                          userInfo.profilePicture.name
                        )
                      }
                    >
                      REMOVE
                    </Button>
                  ) : (
                    <UploadProfilePicture userID={currentUser.uid} />
                  )}
                </Box>
              </Box>
              <Box className="info-row">
                <Box className="info-property">
                  <Typography align="right">account created: </Typography>
                </Box>
                <Box className="info-value">
                  <Typography>
                    {extractDate(currentUser.metadata.creationTime)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}
