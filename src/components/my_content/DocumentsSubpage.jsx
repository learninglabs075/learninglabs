import React, { useState, useEffect } from "react";
import { Box, Button, Link } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Alert from "@material-ui/lab/Alert";
import FileUpload from "../../app/utils/FileUpload.js";
import firebase from "../../app/config/firebaseConfig.js";
import { DataGrid } from "@material-ui/data-grid";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import DeleteIcon from "@material-ui/icons/Delete";
import { extractDate } from "../../app/utils/utils.js";

function extractFileType(type) {
  if (type === "application/pdf") {
    return "PDF";
  } else {
    return "N/A";
  }
}

async function deleteDocumentFromStorage(firestoreID, userID) {
  const documentFirestoreRef = firebase
    .firestore()
    .collection("user_files")
    .doc(userID)
    .collection("documents")
    .doc(firestoreID);

  const fetchedFilename = await documentFirestoreRef.get();

  const documentStorageRef = firebase
    .storage()
    .ref()
    .child(`users/${userID}/documents/${fetchedFilename.data().name}`);

  try {
    await documentFirestoreRef.delete();
  } catch (error) {
    console.log("an error while deleting the auxillary file");
    console.log(error.message);
  }
  try {
    await documentStorageRef.delete();
  } catch (error) {
    console.log("an error while deleting the auxillary file");
    console.log(error.message);
  }
}

export default function DocumentsSubpage(props) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [documents, setDocuments] = useState([]);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.wolfram.mathematica",
    "application/vnd.wolfram.cdf",
  ];

  const acceptedExtensions = ["nb", "pdf"];

  const firestoreRef = firebase
    .firestore()
    .collection("user_files")
    .doc(props.userID)
    .collection("documents");

  function fetchMyDocuments() {
    const ref = firebase
      .firestore()
      .collection("user_files")
      .doc(props.userID)
      .collection("documents");
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
      setDocuments((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyDocuments();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  const columns = [
    { field: "name", headerName: "file name", width: 300 },
    { field: "uploaded", headerName: "uploaded", width: 180 },
    { field: "type", headerName: "type", width: 105 },
    { field: "size", headerName: "size (MB)", width: 140 },
    {
      field: "url",
      headerName: "open",
      sortable: false,
      filterable: false,
      headerAlign: "center",
      width: 90,
      renderCell: (params) => (
        <Link href={params.value} rel="noreferrer" target="_blank">
          <OpenInNewIcon
            style={{ fontSize: 20 }}
            className="open-file-icon pointer"
          />
        </Link>
      ),
    },

    {
      field: "id",
      headerName: "delete",
      sortable: false,
      filterable: false,
      headerAlign: "center",
      width: 100,
      renderCell: (params) => (
        <button
          aria-label="delete"
          className="delete-button delete-file-icon hover-pointer"
          onClick={() => deleteDocumentFromStorage(params.value, props.userID)}
        >
          <DeleteIcon />
        </button>
      ),
    },
  ];

  const handleSelectFile = (e) => {
    let selectedFile = e.target.files[0];
    const fileType = selectedFile.type;
    const fileExtension = selectedFile.name.split(".").pop();
    console.log("file type: " + fileType);
    console.log("file extension: " + fileExtension);
    const validFile =
      selectedFile &&
      (acceptedTypes.includes(fileType) ||
        acceptedExtensions.includes(fileExtension));

    if (validFile) {
      setFile(selectedFile);
      setError(false);
      setErrorMessage("");
    } else {
      setFile(null);
      setError(true);
      setErrorMessage("Please select a PDF or Mathematica (.nb or .cdf) file");
    }
  };

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header">
        <Typography variant="h3" color="primary">
          My Documents
        </Typography>
      </Box>
      <Box className="flex-column full-width align-center">
        <Box className="document-grid">
          <DataGrid rows={documents} columns={columns} pageSize={10} />
        </Box>

        <Box className="flex-center-all column full-width padding-top-light">
          <form autoComplete="off">
            <Button
              color="primary"
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
            >
              Upload
              <input type="file" hidden onChange={handleSelectFile} />
            </Button>
          </form>
          <Box padding={1}>
            {error && <Alert severity="warning">{errorMessage}</Alert>}
            {file && <Typography>{file.name}</Typography>}
            {file && (
              <FileUpload
                category="document"
                file={file}
                setFile={setFile}
                storagePath={`users/${props.userID}/documents/${file.name}`}
                firestoreRef={firestoreRef}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
