import React, { useState } from "react";
import { Box, Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { ZoomControl } from "../../app/utils/utils";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const options = {
  cMapUrl: "cmaps/",
  cMapPacked: true,
};

export default function PreviewPDF({ open, handleClose, url }) {
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1.5);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  return (
    <>
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
          <Box className="modal-form-v1 modal-pdf-preview">
            <Box
              style={{
                maxHeight: "87vh",
                maxWidth: "80vw",
              }}
            >
              <Box className="full-height flex justify-center">
                <Document
                  file={url}
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
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
