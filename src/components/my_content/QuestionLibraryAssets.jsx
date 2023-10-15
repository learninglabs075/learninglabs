import React, { useState, useEffect } from "react";
import { Box, Button, Typography } from "@material-ui/core";
import { Card, CardContent } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import { TextField, IconButton, InputAdornment } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import PermMediaIcon from "@material-ui/icons/PermMedia";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import FileUpload from "../../app/utils/FileUpload.js";
import SearchIcon from "@material-ui/icons/Search";
import Alert from "@material-ui/lab/Alert";
import firebase from "../../app/config/firebaseConfig.js";
import { extractDate } from "../../app/utils/utils.js";
import { Formik, Form } from "formik";

async function fetchQueriedImages(searchTerm, productLibraryID, setImages) {
  const ref = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID)
    .collection("images");
  const querySnapshot = await ref
    .where("name", "==", searchTerm)
    .limit(20)
    .get();
  const fetchedItems = [];
  querySnapshot.forEach((doc) => {
    fetchedItems.push({
      id: doc.id,
      name: doc.data().name,
      size: doc.data().size,
      url: doc.data().url,
      uploaded: extractDate(new Date(doc.data().uploaded.seconds * 1000)),
    });
  });
  setImages((prevState) => fetchedItems);
}

async function deleteLibraryImage(
  productLibraryID,
  fileName,
  docID,
  setImageIndex
) {
  const imageStorageRef = firebase
    .storage()
    .ref()
    .child(
      `${process.env.REACT_APP_PRODUCT_COLLECTION}/${productLibraryID}/images/${fileName}`
    );

  const imageFirestoreRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID)
    .collection("images")
    .doc(docID);

  try {
    await imageStorageRef.delete();
    await imageFirestoreRef.delete();
  } catch (error) {
    console.log("an error while deleting the image");
  }

  setImageIndex((prevIndex) => -1);
}

export default function QuestionLibraryAssets({
  productLibraryID,
  productLibraryTitle,
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [images, setImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(-1);

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const types = ["image/png", "image/jpeg"];

  const handleSelectFile = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setFile(selected);
      setError(false);
      setErrorMessage("");
    } else {
      setFile(null);
      setError(true);
      setErrorMessage("Please select an image file (png or jpeg)");
    }
  };

  const firestoreRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID)
    .collection("images");

  function fetchLibraryImages() {
    firestoreRef.limit(50).onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          name: doc.data().name,
          size: doc.data().size,
          url: doc.data().url,
          uploaded: extractDate(new Date(doc.data().uploaded.seconds * 1000)),
        });
      });
      setImages((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchLibraryImages();
    return unsubscribe;
    // eslint-disable-next-line
  }, [productLibraryID]);

  return (
    <>
      <Button
        type="button"
        variant="contained"
        color="inherit"
        onClick={handleOpen}
        startIcon={<PermMediaIcon />}
      >
        ASSETS LIBRARY
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
            <Typography variant="h5">{productLibraryTitle}</Typography>

            <Box className="flex-row library-image-subdisplay">
              <Box className="flex-column">
                <Box className="library-image-list">
                  <Box className="search-library-images">
                    <Formik initialValues={{ searchTerm: "" }}>
                      {({ values, handleChange }) => (
                        <Form autoComplete="off">
                          <TextField
                            name="searchTerm"
                            onChange={handleChange}
                            variant="outlined"
                            placeholder="file name (example: sunset.png)"
                            className="search-library-images"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="search for images belonging to this question library"
                                    edge="end"
                                    onClick={() => {
                                      if (values.searchTerm === "") {
                                        fetchLibraryImages();
                                      } else {
                                        fetchQueriedImages(
                                          values.searchTerm,
                                          productLibraryID,
                                          setImages
                                        );
                                        setImageIndex((prevIndex) => -1);
                                      }
                                    }}
                                  >
                                    <SearchIcon />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Form>
                      )}
                    </Formik>
                  </Box>
                  {images.length > 0 && (
                    <List component="nav">
                      {images.map((image, index) => (
                        <ListItem
                          key={image.id}
                          onClick={(prevIndex) => setImageIndex(index)}
                          button
                        >
                          {image.name !== "" && (
                            <ListItemText
                              primary={image.name}
                              secondary={"uploaded: " + image.uploaded}
                            />
                          )}
                          {image.name === "" && (
                            <ListItemText
                              primary="(no title)"
                              secondary={"uploaded: " + image.uploaded}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                <Box className="flex-column upload-image-container">
                  <Box padding={1} minHeight={30} minWidth={250}>
                    {error ? (
                      <Alert severity="warning">{errorMessage}</Alert>
                    ) : null}
                    {file ? <Typography>{file.name}</Typography> : null}
                    {file ? (
                      <FileUpload
                        category="image"
                        file={file}
                        setFile={setFile}
                        storagePath={`${process.env.REACT_APP_PRODUCT_COLLECTION}/${productLibraryID}/images/${file.name}`}
                        firestoreRef={firestoreRef}
                      />
                    ) : null}
                  </Box>
                  <form autoComplete="off">
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload
                      <input type="file" hidden onChange={handleSelectFile} />
                    </Button>
                  </form>
                </Box>
              </Box>
              {imageIndex === -1 ? (
                <Box className="flex-center-all" width={400}>
                  <Typography color="textSecondary">
                    (please select an image)
                  </Typography>
                </Box>
              ) : null}
              {imageIndex >= 0 ? (
                <Box className="flex-column">
                  <Box style={{ maxHeight: "40vh", overflow: "auto" }}>
                    <img src={images[imageIndex]?.url} alt="" width="400px" />
                  </Box>
                  <Box className="flex wrap library-image-info">
                    <Card
                      style={{
                        width: "440px",
                        backgroundColor: "rgba(245, 245, 245, 1)",
                        padding: "10px",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">
                          {images[imageIndex]?.name}
                        </Typography>

                        <Typography variant="subtitle2" color="textSecondary">
                          {"size: " +
                            (images[imageIndex]?.size / 1000000).toFixed(2) +
                            " Mb"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          style={{ wordWrap: "break-word" }}
                        >
                          {images[imageIndex]?.url}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <button
                    className="delete-button padding-top-medium hover-pointer-default"
                    onClick={() =>
                      deleteLibraryImage(
                        productLibraryID,
                        images[imageIndex].name,
                        images[imageIndex].id,
                        setImageIndex
                      )
                    }
                  >
                    DELETE IMAGE
                  </button>
                </Box>
              ) : null}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
