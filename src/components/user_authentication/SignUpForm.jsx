import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, TextField, CircularProgress } from "@material-ui/core";
import { Typography, Modal, Backdrop, Fade } from "@material-ui/core";
import { useAuth } from "../../app/contexts/AuthContext.js";
import Alert from "@material-ui/lab/Alert";
import { setNamePending } from "../../app/firestoreClient.js";

const EmailField = (props) => (
  <TextField label="email" id="email" variant="filled" fullWidth {...props} />
);

const FirstNameField = (props) => (
  <TextField
    label="first name"
    id="firstName"
    variant="filled"
    fullWidth
    required
    {...props}
  />
);

const LastNameField = (props) => (
  <TextField
    label="last name"
    id="Lastname"
    variant="filled"
    fullWidth
    required
    {...props}
  />
);

const PasswordField = (props) => (
  <TextField
    label="password"
    id="password"
    type="password"
    variant="filled"
    fullWidth
    {...props}
  />
);

const confirmPasswordField = (props) => (
  <TextField
    label="confirm password"
    id="confirmPassword"
    type="password"
    variant="filled"
    fullWidth
    {...props}
  />
);

const initialValues = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpForm() {
  const { signup, logout } = useAuth();

  const [signUpStatus, setSignUpStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setSignUpStatus("");
  };

  return (
    <>
      <Button type="button" color="primary" onClick={handleOpen}>
        sign up
      </Button>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className="flex-center-all"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box className="modal-form-v1 modal-common-styling relative">
            <Box className="flex-center-all signup-header">
              <Typography variant="h5">Create a New Account</Typography>
            </Box>
            <Box width={350}>
              {signUpStatus === "password mismatch" ? (
                <Alert severity="warning">Passwords do not match</Alert>
              ) : null}

              {signUpStatus === "failure" ? (
                <Alert severity="warning">{errorMessage}</Alert>
              ) : null}
            </Box>
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting }) => {
                if (values.password !== values.confirmPassword) {
                  setSignUpStatus("password mismatch");
                  return;
                }

                if (!values?.firstName || !values?.lastName) {
                  setSignUpStatus("failure");
                  setErrorMessage("Please enter your first and last name");
                  setSubmitting(false);
                  return;
                }

                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 1000));

                try {
                  await signup(values.email, values.password);
                  await setNamePending(
                    values.email,
                    values.firstName,
                    values.lastName
                  );
                  setSubmitting(false);
                  setSignUpStatus("success");
                  await new Promise((r) => setTimeout(r, 1200));
                  await logout();
                  handleClose();
                } catch (error) {
                  setSignUpStatus("failure");
                  setErrorMessage(error.message);
                  setSubmitting(false);
                  return;
                }
              }}
            >
              {({ values, isSubmitting }) => (
                <Form autoComplete="off">
                  <Box className="flex-column signup-fields">
                    <Field name="email" as={EmailField} />
                    <Field name="firstName" as={FirstNameField} />
                    <Field name="lastName" as={LastNameField} />
                    <Field name="password" as={PasswordField} />
                    <Field name="confirmPassword" as={confirmPasswordField} />
                  </Box>

                  <Box
                    marginTop={1}
                    width={350}
                    className="padding-bottom-medium"
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={
                        isSubmitting ||
                        !values.firstName ||
                        !values.lastName ||
                        !values.email ||
                        !values.password ||
                        !values.confirmPassword
                      }
                    >
                      {isSubmitting ? (
                        <CircularProgress size={25} />
                      ) : (
                        "SIGN UP"
                      )}
                    </Button>
                  </Box>
                  {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                </Form>
              )}
            </Formik>
            {signUpStatus === "success" ? (
              <Box className="account-created">
                <Alert severity="success">Account created!</Alert>
              </Box>
            ) : null}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
