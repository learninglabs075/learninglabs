import React, { useState, useEffect, useRef } from "react";
import { Box, MenuItem, MenuList, Paper } from "@material-ui/core";
import { Grow, Popper } from "@material-ui/core";
import { ClickAwayListener } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import { useAuth } from "../app/contexts/AuthContext.js";
import { Link, useHistory } from "react-router-dom";
import { fetchUserPermissions } from "../app/firestoreClient.js";

export default function UserAccountMenu() {
  const { logout } = useAuth();
  const { currentUser } = useAuth();
  const history = useHistory();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [showAdminMenuLink, setShowAdminMenuLink] = useState(false);

  async function hasAdminPermissions(user) {
    let userPermissions = await fetchUserPermissions(user.uid);
    return userPermissions?.includes("admin");
  }

  async function isAdmin(user, history) {
    return await hasAdminPermissions(user);
  }

  useEffect(() => {
    isAdmin(currentUser, history).then((result) => {
      setShowAdminMenuLink(result);
    });
    // eslint-disable-next-line
  }, []);

  async function handleLogout() {
    setError("");
    try {
      await logout();
      history.push("/");
    } catch {
      setError("Failed to log out.");
      console.log(error);
    }
  }

  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  return (
    <Box position="relative" className="flex">
      <IconButton
        edge="start"
        color="inherit"
        aria-label="user account menu"
        ref={anchorRef}
        aria-controls={open ? "menu-list-grow" : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <AccountCircleIcon fontSize="large" />
      </IconButton>
      <Box className="user-account-menu">
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === "bottom" ? "center top" : "center bottom",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem>
                      <Link
                        to="/my_profile"
                        style={{ textDecoration: "none", color: "black" }}
                      >
                        My Account
                      </Link>
                    </MenuItem>
                    {showAdminMenuLink && (
                      <MenuItem>
                        <Link
                          to="/admin"
                          style={{ textDecoration: "none", color: "black" }}
                        >
                          Admin
                        </Link>
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </Box>
  );
}
