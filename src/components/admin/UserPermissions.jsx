import React, { useEffect, useState } from "react";
import {
  Grid,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  TableBody,
  Typography,
} from "@material-ui/core";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { useHistory } from "react-router-dom";
import { fetchUserPermissions } from "../../app/firestoreClient.js";
import { ThemeProvider } from "@material-ui/core/styles";
import MainNavBar from "./../MainNavBar";
import { MyProfileTheme } from "../../themes.js";
import firebase from "../../app/config/firebaseConfig.js";
import { headerStyle, headerStyle2 } from "./../../app/utils/stylingSnippets";

export default function UserPermissions() {
  const history = useHistory();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [questionLibraries, setQuestionLibraries] = useState([]);

  async function hasImpersonatePermissions(user) {
    let userPermissions = await fetchUserPermissions(user.uid);
    return userPermissions?.includes("impersonate");
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

  useEffect(() => {
    // Retrieve the "users" collection from Firestore
    firebase
      .firestore()
      .collection("users")
      .onSnapshot((snapshot) => {
        const updatedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(updatedUsers);
      });

    firebase
      .firestore()
      .collection("products")
      .onSnapshot((snapshot) => {
        const updatedQuestionLibraries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuestionLibraries(updatedQuestionLibraries);
      });
  }, []);

  useEffect(() => {
    // Filter users based on the search term
    const filtered = users.filter((user) => {
      return (
        user?.firstName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        user?.lastName?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handlePermissionChange = (userId, newPermission, userPermissions) => {
    let newPermissions = [...(userPermissions || [])];
    newPermissions.includes(newPermission)
      ? (newPermissions = newPermissions.filter(
          (perm) => perm !== newPermission
        ))
      : newPermissions.push(newPermission);

    // setSelectedPermissions(newPermissions);

    firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .update({ permissions: newPermissions });
  };

  return (
    <>
      <ThemeProvider theme={MyProfileTheme}>
        <MainNavBar />
        <Box className="display-area-full">
          <Box className="subpage-header">
            <Typography variant="h3" color="primary">
              Admin
            </Typography>
          </Box>
          {searchTerm !== undefined && (
            <Grid>
              <input
                type="text"
                placeholder="Search by first or last name"
                value={searchTerm}
                style={{ marginBottom: "25px", marginLeft: "25px" }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
          )}
          <Box className="flex-column flex-center-all">
            <TableContainer style={{ maxHeight: "500px" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={headerStyle}>Student Name </TableCell>
                    <TableCell style={headerStyle2}>Admin</TableCell>
                    <TableCell style={headerStyle2}>Impersonate</TableCell>
                    <TableCell style={headerStyle2}>
                      editQuestionLibraries
                    </TableCell>
                    {questionLibraries?.map((library, index) => (
                      <TableCell
                        style={headerStyle2}
                        key={`${library.id}-${index}`}
                      >
                        {library?.title?.length < 10 && library?.title}
                        {library?.title?.length > 10 && (
                          <Tooltip title={library?.title} placement="top">
                            <span>{library?.title?.substring(0, 10)} *</span>
                          </Tooltip>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers?.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell xs={2} key={user.id}>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell xs={2}>
                        <input
                          type="checkbox"
                          checked={
                            user?.permissions?.includes("admin") || false
                          }
                          onChange={() =>
                            handlePermissionChange(
                              user.id,
                              "admin",
                              user?.permissions
                            )
                          }
                        />
                      </TableCell>
                      <TableCell xs={2}>
                        <input
                          type="checkbox"
                          checked={
                            user?.permissions?.includes("impersonate") || false
                          }
                          onChange={() =>
                            handlePermissionChange(
                              user.id,
                              "impersonate",
                              user?.permissions
                            )
                          }
                        />
                      </TableCell>
                      <TableCell xs={2}>
                        <input
                          type="checkbox"
                          checked={
                            user?.permissions?.includes(
                              "editQuestionLibraries"
                            ) || false
                          }
                          onChange={() =>
                            handlePermissionChange(
                              user.id,
                              "editQuestionLibraries",
                              user?.permissions
                            )
                          }
                        />
                      </TableCell>
                      {questionLibraries?.map((library, index) => (
                        <TableCell xs={2} key={`${library.id}-${index}`}>
                          <input
                            type="checkbox"
                            checked={
                              user?.permissions?.includes(library.id) || false
                            }
                            onChange={() =>
                              handlePermissionChange(
                                user.id,
                                library.id,
                                user?.permissions
                              )
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </ThemeProvider>
    </>
  );
}
