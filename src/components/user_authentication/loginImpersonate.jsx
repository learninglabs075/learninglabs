import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@material-ui/core";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { useHistory } from "react-router-dom";
import { auth, functions } from "../../app/config/firebaseConfig.js";
import { fetchUserPermissions } from "../../app/firestoreClient.js";
import { ThemeProvider } from "@material-ui/core/styles";
import MainNavBar from "./../MainNavBar";
import { MyProfileTheme } from "../../themes.js";

export default function LoginImpersonate() {
  const history = useHistory();
  const { currentUser } = useAuth();

  const initialValues = {
    userID: "",
  };

  const UserIDField = (props) => (
    <TextField
      label="userID"
      id="userID"
      variant="filled"
      fullWidth
      {...props}
    />
  );

  async function loginButtonClicked(setSubmitting, values) {
    setSubmitting(true);

    values?.userID !== ""
      ? await impersonate(values.userID, history)
      : alert(
          "Please enter a valid userID for the person you'd like to impersonate."
        );

    setSubmitting(false);
  }

  async function impersonate(userID, history) {
    if (userID === "") {
      return;
    }

    const impersonate = functions.httpsCallable("impersonateUser");
    const result = await impersonate({
      callingUserID: currentUser.uid,
      userID: userID,
    });

    await auth.signInWithCustomToken(result.data.impersonatedUser);
    history.push("/classroom");
  }

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
          <Box className="flex-column flex-center-all">
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                await loginButtonClicked(setSubmitting, values);
              }}
            >
              {({ values, isSubmitting, setFieldValue, handleChange }) => (
                <Form autoComplete="off">
                  <Box className="flex-column space-around">
                    <Box className="flex-column space-around email-password-container">
                      <Field name="userID" as={UserIDField} />
                    </Box>

                    <Box className="padding-vertical-light">
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        color="primary"
                        fullWidth
                      >
                        {isSubmitting ? (
                          <CircularProgress size={25} />
                        ) : (
                          "LOG IN"
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}
