import React from "react";
import { Box } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";

export default function PreviewImage({ open, handleClose, url }) {
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
          <Box className="modal-form-v1 modal-image-preview">
            <Box width="80vh">
              <img src={url} alt="" width="100%" />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
