import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, TextField, CircularProgress } from "@material-ui/core";
import { Typography, Modal, Backdrop, Fade } from "@material-ui/core";
import { useAuth } from "../../app/contexts/AuthContext.js";
import Alert from "@material-ui/lab/Alert";
import EditIcon from "@material-ui/icons/Edit";

const EmailField = (props) => (
  <TextField
    label="new email"
    id="email"
    variant="filled"
    fullWidth
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

const initialValues = {
  newEmail: "",
  password: "",
};

export default function UpdateEmailForm(props) {
  const { updateEmail, login, currentUser } = useAuth();

  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setStatus("");
    setErrorMessage("");
  };

  return (
    <>
      <Button
        style={{ color: "gray" }}
        onClick={handleOpen}
        startIcon={<EditIcon />}
      >
        EDIT
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
          <Box className="modal-form-v2 modal-common-styling">
            <Box className="flex-justify-center padding-light">
              <Typography variant="h5">Update Email</Typography>
            </Box>

            <Box className="update-user-alert">
              {status === "failure" ? (
                <Alert severity="warning">{errorMessage}</Alert>
              ) : null}
            </Box>
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                setStatus("");
                setErrorMessage("");
                try {
                  await login(currentUser.email, values.password);
                  await new Promise((r) => setTimeout(r, 800));
                  await updateEmail(values.newEmail);
                  setStatus("success");
                  props.setEmail(values.newEmail);
                  setSubmitting(false);
                  await new Promise((r) => setTimeout(r, 1000));
                  handleClose();
                } catch (error) {
                  setStatus("failure");
                  setErrorMessage(error.message);
                  setSubmitting(false);
                }
              }}
            >
              {({ values, isSubmitting }) => (
                <Form autoComplete="off">
                  <Box className="flex-column update-email-fields">
                    <Field name="newEmail" as={EmailField} />
                    <Box>
                      <Typography color="textSecondary" align="center">
                        To protect your account
                      </Typography>
                      <Typography color="textSecondary" align="center">
                        please also enter your current password:
                      </Typography>
                      <Field name="password" as={PasswordField} />
                    </Box>
                  </Box>

                  <Box className="update-email-submit-button">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <CircularProgress color="secondary" size={25} />
                      ) : (
                        "UPDATE"
                      )}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
            <Box className="flex-justify-center absolute update-user-success">
              {status === "success" ? (
                <Alert severity="success">Your email has been updated!</Alert>
              ) : null}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
