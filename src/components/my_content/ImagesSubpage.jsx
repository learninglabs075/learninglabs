import React, { useState, useEffect } from "react";
import { Box, Button } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Alert from "@material-ui/lab/Alert";
import FileUpload from "../../app/utils/FileUpload.js";
import firebase from "../../app/config/firebaseConfig.js";
import { GridList, GridListTile, GridListTileBar } from "@material-ui/core";
import { extractDate } from "../../app/utils/utils.js";

function extractFileType(type) {
  if (type === "application/pdf") {
    return "PDF";
  }
}

async function deleteImage(userID, fileName, docID) {
  const imageStorageRef = firebase
    .storage()
    .ref()
    .child(`users/${userID}/images/${fileName}`);

  const imageFirestoreRef = firebase
    .firestore()
    .collection("user_files")
    .doc(userID)
    .collection("images")
    .doc(docID);

  try {
    await imageStorageRef.delete();
    await imageFirestoreRef.delete();
  } catch (error) {
    console.log("an error while deleting the image");
  }
}

export default function ImagesSubpage(props) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [images, setImages] = useState([]);

  const types = ["image/png", "image/jpeg"];

  const firestoreRef = firebase
    .firestore()
    .collection("user_files")
    .doc(props.userID)
    .collection("images");

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

  function fetchMyImages() {
    const ref = firebase
      .firestore()
      .collection("user_files")
      .doc(props.userID)
      .collection("images");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          name: doc.data().name,
          size: (doc.data().size / 1000000).toFixed(2),
          type: extractFileType(doc.data().type),
          uploaded: extractDate(new Date(doc.data().uploaded.seconds * 1000)),
          url: doc.data().url,
        });
      });
      setImages((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyImages();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header">
        <Typography variant="h3" color="primary">
          My Images
        </Typography>
      </Box>

      <Box className="flex-center-all image-grid-container">
        <GridList cellHeight={180} className="image-grid" cols={4}>
          {images.map((image) => (
            <GridListTile key={image.id}>
              <img src={image.url} alt={image.name} />
              <GridListTileBar
                title={image.name}
                subtitle={<span>uploaded: {image.uploaded}</span>}
                actionIcon={
                  <button
                    className="delete-button-silver delete-image-button hover-pointer-gray"
                    onClick={() =>
                      deleteImage(props.userID, image.name, image.id)
                    }
                  >
                    X
                  </button>
                }
              />
            </GridListTile>
          ))}
        </GridList>
        {images.length === 0 ? (
          <Box padding={10}>
            <Typography color="primary">(no images uploaded)</Typography>
          </Box>
        ) : null}
        <Box className="flex-column upload-image-container">
          <Box padding={1} minWidth={300}>
            {error && <Alert severity="warning">{errorMessage}</Alert>}
            {file && <Typography>{file.name}</Typography>}
            {file && (
              <FileUpload
                category="image"
                file={file}
                setFile={setFile}
                storagePath={`users/${props.userID}/images/${file.name}`}
                firestoreRef={firestoreRef}
              />
            )}
          </Box>
          <form autoComplete="off">
            <Button
              color="primary"
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
    </Box>
  );
}
