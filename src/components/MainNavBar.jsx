import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { ThemeProvider } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import { MainNavBarTheme } from "../themes.js";
import UserAccountMenu from "./UserAccountMenu.jsx";

export default function MainNavBar() {
  return (
    <ThemeProvider theme={MainNavBarTheme}>
      <AppBar position="fixed" style={{ zIndex: 1201 }}>
        <Toolbar>
          <Box className="flex-align-center main-nav-logo">
            <Box padding="1px">
              <img
                src={process.env.REACT_APP_MENUBAR_IMAGE}
                alt={process.env.REACT_APP_PRODUCT + " learn together"}
              />
            </Box>

            <Typography variant="h3" className="main-nav-logo-divider">
              |
            </Typography>
            <Typography variant="h5">learn together</Typography>
          </Box>
          <Box className="flex-align-center main-nav-link-wrapper">
            <Link to="/classroom" className="main-nav-link no-decoration">
              <li>My Courses</li>
            </Link>
            <Link to="/content" className="main-nav-link no-decoration">
              <li>My Content</li>
            </Link>
            <Link
              to="/whiteboard/fullscreen"
              className="main-nav-link no-decoration"
            >
              <li>Whiteboard</li>
            </Link>
          </Box>
          <Box>
            <UserAccountMenu />
          </Box>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}
