import React, { useEffect } from "react";
import { Box, Button, Typography } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { MyProfileTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { Link, useHistory } from "react-router-dom";
import { fetchUserPermissions } from "../../app/firestoreClient.js";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const history = useHistory();

  async function hasImpersonatePermissions(user) {
    let userPermissions = await fetchUserPermissions(user.uid);
    return userPermissions?.includes("admin");
  }

  async function restrictUnauthorizedAccess(user, history) {
    let userCanImpersonate = await hasImpersonatePermissions(user);

    if (!userCanImpersonate) {
      history.push("/access_restricted");
    }
  }

  useEffect(() => {
    restrictUnauthorizedAccess(currentUser, history);
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={MyProfileTheme}>
      <div className="page-background">
        <MainNavBar />
        <Box className="display-area-full">
          <Box className="subpage-header">
            <Typography variant="h3" color="primary">
              Admin
            </Typography>
          </Box>
          <Box className="flex-row justify-center padding-light">
            <Box className="flex-column flex-center-all">
              <Box>
                <Link to="/userPermissions">
                  <Button
                    variant="contained"
                    color="primary"
                    className="margin-bottom-light"
                  >
                    User Permissions
                  </Button>
                </Link>
              </Box>
              <Box style={{ margin: "50px" }}>
                <Link to="/clone_course">
                  <Button
                    variant="contained"
                    color="primary"
                    className="margin-bottom-light"
                  >
                    Clone Course
                  </Button>
                </Link>
              </Box>
              <Box>
                <Link to="/impersonate">
                  <Button
                    variant="contained"
                    color="primary"
                    className="margin-bottom-light"
                  >
                    Impersonate User
                  </Button>
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}
