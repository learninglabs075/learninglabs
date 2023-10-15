import React, { useState } from "react";
import { Formik, Field, Form } from "formik";
import { Box, TextField, Button } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade, CircularProgress } from "@material-ui/core";
import { Edit } from "@material-ui/icons/";
import { updateLink } from "../../app/firestoreClient.js";

const TitleField = (props) => (
  <TextField
    label="Title"
    id="embedded link title"
    variant="filled"
    fullWidth
    {...props}
  />
);

const URLField = (props) => (
  <TextField
    placeholder="example: https://www.youtube.com/embed/..."
    id="external url"
    variant="outlined"
    fullWidth
    {...props}
  />
);

const DescriptionField = (props) => (
  <TextField
    label="Description (optional)"
    id="embedded link description"
    variant="filled"
    fullWidth
    multiline
    rows={3}
    {...props}
  />
);

export default function EditEmbeddableLink({ linkInfo, userID }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const initialValues = {
    title: linkInfo?.title || "",
    url: linkInfo?.url || "",
    description: linkInfo?.description || "",
  };

  return (
    <>
      <Button onClick={handleOpen} startIcon={<Edit />}>
        Edit
      </Button>

      <Modal
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
          <Box className="modal-form-v1 modal-common-styling">
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 800));
                try {
                  updateLink(values, userID, linkInfo?.id);
                  //   addLink(values, props.userID);
                } catch (error) {
                  console.log("error: cannot save question info to database");
                  console.log(error.message);
                }
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({ values, isSubmitting }) => (
                <Form autoComplete="off">
                  <Typography variant="h5" color="primary">
                    Edit Link
                  </Typography>
                  <br />
                  <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    height={240}
                    width={350}
                  >
                    <Field name="url" as={URLField} />
                    <Box
                      display="flex"
                      flexDirection="column"
                      height={160}
                      justifyContent="space-between"
                    >
                      <Field name="title" as={TitleField} />
                      <Field name="description" as={DescriptionField} />
                    </Box>
                  </Box>
                  <Box marginTop={3} display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "Save"}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
