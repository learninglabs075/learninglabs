import React, { useState, useEffect } from "react";
import { Box } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Select, MenuItem } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { ZoomControl } from "../../app/utils/utils.js";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const options = {
  cMapUrl: "cmaps/",
  cMapPacked: true,
};

export default function DocumentsSubpage({ userID }) {
  const [documents, setDocuments] = useState([]);
  const [docIndex, setDocIndex] = useState(-1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleDocSelect = (event) => {
    setDocIndex((prevIndex) => event.target.value);
  };

  useEffect(() => {
    const unsubscribe = fetchMyDocuments(userID, setDocuments);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header flex justify-start">
        <Typography variant="h3" color="primary">
          Documents
        </Typography>
        <Box className="padding-left-medium">
          <Select
            value={docIndex}
            onChange={handleDocSelect}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={-1} disabled>
              <Typography color="textSecondary">select a document</Typography>
            </MenuItem>
            {documents.map((document, docIndex) => (
              <MenuItem key={document.id} value={docIndex}>
                {document.name.slice(0, 30)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
      {docIndex < 0 && (
        <Box className="flex please-select-item">
          <Typography color="primary">(please select a document)</Typography>
        </Box>
      )}
      {docIndex >= 0 && (
        <Box className="margin-auto flex-justify-center">
          <Document
            file={documents[docIndex].url}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
          >
            {Array.from(new Array(numPages), (element, index) => (
              <Page
                className="relative padding-light flex-justify-center"
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={zoom}
              >
                <Typography
                  className="absolute pdf-page-annotation"
                  variant="caption"
                  color="textSecondary"
                >
                  page {index + 1} of {numPages}
                </Typography>
              </Page>
            ))}
          </Document>
          <ZoomControl zoom={zoom} setZoom={setZoom} />
        </Box>
      )}
    </Box>
  );
}

function fetchMyDocuments(userID, setDocuments) {
  const ref = firebase
    .firestore()
    .collection("user_files")
    .doc(userID)
    .collection("documents");
  ref.onSnapshot((querySnapshot) => {
    const fetchedItems = [];
    querySnapshot.forEach((doc) => {
      fetchedItems.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    setDocuments((prevState) => fetchedItems);
  });
}
