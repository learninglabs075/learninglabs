import React, { useState } from "react";
import { Button } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import firebase from "../../app/config/firebaseConfig.js";
import FileUpload from "../../app/utils/FileUpload.js";
import Alert from "@material-ui/lab/Alert";

export default function UploadCourseImage(props) {
  const [pictureFile, setPictureFile] = useState(null);
  const [uploadError, setUploadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const types = ["image/png", "image/jpeg"];

  function generateStoragePath(userID, filename) {
    return `courses/${props.courseID}/course_picture/${filename}`;
  }

  function generateFirestoreRef() {
    return firebase.firestore().collection("courses").doc(props.courseID);
  }

  const handleFileUpload = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setPictureFile(selected);
      setUploadError(false);
      setErrorMessage("");
    } else {
      setPictureFile(null);
      setUploadError(true);
      setErrorMessage("Please select an image file (png or jpeg)");
    }
  };

  return (
    <>
      <Button
        type="button"
        component="label"
        style={{ color: "rgba(0, 0, 0, 0.54)" }}
        startIcon={<CloudUploadIcon />}
      >
        Upload
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>
      {uploadError && <Alert severity="warning">{errorMessage}</Alert>}
      {pictureFile && (
        <FileUpload
          category="coursePicture"
          file={pictureFile}
          setFile={setPictureFile}
          storagePath={generateStoragePath(props.userID, pictureFile.name)}
          firestoreRef={generateFirestoreRef()}
        />
      )}
    </>
  );
}
