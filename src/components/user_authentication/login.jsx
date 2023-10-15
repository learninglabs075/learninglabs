import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, TextField, CircularProgress } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import SignUpForm from "../user_authentication/SignUpForm.jsx";
import ResetPasswordForm from "../user_authentication/ResetPasswordForm.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { useHistory } from "react-router-dom";
import Alert from "@material-ui/lab/Alert";

const initialValues = {
  email: "",
  password: "",
};

const EmailField = (props) => (
  <TextField label="email" id="email" variant="filled" fullWidth {...props} />
);

const Password = (props) => (
  <TextField
    type="password"
    label="password"
    id="password"
    variant="filled"
    fullWidth
    {...props}
  />
);

export default function Login() {
  const { login } = useAuth();
  const [loginStatus, setLoginStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const history = useHistory();

  return (
    <Box className="flex-column flex-center-all">
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          setSubmitting(true);
          try {
            await new Promise((r) => setTimeout(r, 1000));
            await login(values.email, values.password);
            setSubmitting(false);
            history.push("/classroom");
          } catch (error) {
            setLoginStatus("failure");
            setErrorMessage(error.message);
            setSubmitting(false);
          }
        }}
      >
        {({ values, isSubmitting, setFieldValue, handleChange }) => (
          <Form autoComplete="off">
            <Box className="flex-column space-around">
              <Box className="login-error-container">
                {loginStatus === "failure" ? (
                  <Alert severity="warning">{errorMessage}</Alert>
                ) : null}
              </Box>
              <Box className="flex-column space-around email-password-container">
                <Field name="email" as={EmailField} />
                <Field name="password" as={Password} />
              </Box>

              <Box className="padding-vertical-light">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  color="primary"
                  fullWidth
                >
                  {isSubmitting ? <CircularProgress size={25} /> : "LOG IN"}
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
      <Box>
        <ResetPasswordForm />
      </Box>
      <Box display="flex" alignItems="center">
        <Typography variant="subtitle2">Need an account?</Typography>
        <SignUpForm />
      </Box>
    </Box>
  );
}
