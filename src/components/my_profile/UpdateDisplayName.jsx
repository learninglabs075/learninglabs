import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, TextField, CircularProgress } from "@material-ui/core";
import { Typography, Modal, Backdrop, Fade } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useAuth } from "../../app/contexts/AuthContext.js";
import Alert from "@material-ui/lab/Alert";
import EditIcon from "@material-ui/icons/Edit";
import { updateDisplayNameInFirestore } from "../../app/firestoreClient.js";

const UpdateDisplayNameStyles = makeStyles((theme) => ({
  displayNameField: {
    height: 60,
    width: 320,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
  },
}));

const DisplayNameField = (props) => (
  <TextField
    label="name"
    id="display name"
    variant="filled"
    fullWidth
    {...props}
  />
);

const initialValues = {
  displayName: "",
};

export default function UpdateDisplayName(props) {
  const classes = UpdateDisplayNameStyles();

  const { updateDisplayName } = useAuth();

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
              <Typography variant="h5">Update Name</Typography>
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
                  await new Promise((r) => setTimeout(r, 800));
                  await updateDisplayName(values.displayName); //TODO add firstName and lastName
                  await updateDisplayNameInFirestore(
                    values.displayName,
                    props.userID
                  );
                  setStatus("success");
                  props.setDisplayName(values.displayName);
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
                  <Box className={classes.displayNameField}>
                    <Field name="displayName" as={DisplayNameField} />
                  </Box>

                  <Box className="update-name-submit-button">
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
                <Alert severity="success">Your name has been updated!</Alert>
              ) : null}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
