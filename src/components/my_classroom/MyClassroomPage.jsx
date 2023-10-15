import React, { useEffect } from "react";

import { ThemeProvider } from "@material-ui/core/styles";
import MainNavBar from "../MainNavBar.jsx";
import CoursesSubpage from "./CoursesSubpage.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import firebase from "../../app/config/firebaseConfig.js";
import { initializeUser } from "../../app/initializeUser.js";

require("../../themesKoral.js");

export default function MyClassroomPage() {
  const { currentUser, updateDisplayName } = useAuth();

  async function checkUserInitialization() {
    const userRef = firebase.firestore().collection("users");
    try {
      const fetchedUserInfo = await userRef
        .where("userID", "==", currentUser.uid)
        .get();
      if (fetchedUserInfo.empty) {
        console.log("Setting up user account...");

        await initializeUser(currentUser, updateDisplayName);

        console.log("Success! User account has been set up!");
      } else {
        console.log("User account already set up");
      }
    } catch (error) {
      console.log("there was an error initializing the user");
      console.log(error.message);
    }
  }

  useEffect(() => {
    const unsubscribe = checkUserInitialization();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="page-background my-classroom-background">
        <MainNavBar />
        <CoursesSubpage />
      </div>
    </ThemeProvider>
  );
}
