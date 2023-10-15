import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, TextField, CircularProgress } from "@material-ui/core";
import { Typography, Modal, Backdrop, Fade } from "@material-ui/core";
import { useAuth } from "../../app/contexts/AuthContext.js";
import Alert from "@material-ui/lab/Alert";

const EmailField = (props) => (
  <TextField label="email" id="email" variant="filled" fullWidth {...props} />
);

const initialValues = {
  email: "",
};

export default function SignUpForm() {
  const { resetPassword } = useAuth();

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
        style={{
          textTransform: "none",
          backgroundColor: "transparent",
        }}
        onClick={handleOpen}
      >
        <Typography variant="subtitle2" color="textSecondary">
          Forgot my password
        </Typography>
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
            <Box className="padding-bottom-light">
              <Typography color="primary" variant="h5">
                Reset Password
              </Typography>
            </Box>

            <Box className="padding-bottom-light">
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
                  await new Promise((r) => setTimeout(r, 800));
                  await resetPassword(values.email);
                  setStatus("success");
                  setSubmitting(false);
                  await new Promise((r) => setTimeout(r, 2500));
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
                  <Box className="flex-column space-around email-field">
                    <Field name="email" as={EmailField} />
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "RESET"}
                    </Button>
                  </Box>
                  {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                </Form>
              )}
            </Formik>

            {status === "success" ? (
              <Box>
                <Alert severity="success">
                  Check your inbox for a link to reset your password.
                </Alert>
              </Box>
            ) : null}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
