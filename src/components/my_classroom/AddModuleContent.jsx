import React, { useState } from "react";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialIcon from "@material-ui/lab/SpeedDialIcon";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
import WatchLaterIcon from "@material-ui/icons/WatchLater";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import { Box } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import ResourceForm from "./ResourceForm.jsx";
import AssignmentForm from "./AssignmentForm.jsx";

export default function AddModuleContent({
  userID,
  courseID,
  courseTitle,
  modules,
  moduleIndex,
}) {
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);

  const closeContentMenu = () => {
    setContentMenuOpen(false);
  };

  const openContentMenu = () => {
    setContentMenuOpen(true);
  };

  const openAssignmentForm = () => {
    setAssignmentFormOpen(true);
  };

  const closeAssignmentForm = () => {
    setAssignmentFormOpen(false);
  };

  const openResourceForm = () => {
    setResourceFormOpen(true);
  };

  const closeResourceForm = () => {
    setResourceFormOpen(false);
  };

  return (
    <>
      <div className="expanding-speed-dial-container">
        <div className="speed-dial-position">
          <SpeedDial
            ariaLabel="add module content"
            className="speed-dial absolute"
            icon={<SpeedDialIcon />}
            onClose={closeContentMenu}
            onOpen={openContentMenu}
            open={contentMenuOpen}
            direction={"up"}
          >
            <SpeedDialAction
              icon={<WatchLaterIcon />}
              tooltipTitle={"Assignment"}
              tooltipOpen
              onClick={() => {
                openAssignmentForm();
                closeContentMenu();
              }}
            />
            <SpeedDialAction
              icon={<MenuBookIcon />}
              tooltipTitle={"Resource"}
              tooltipOpen
              onClick={() => {
                openResourceForm();
                closeContentMenu();
              }}
            />
          </SpeedDial>
        </div>
      </div>

      <Modal
        className="flex-center-all"
        open={assignmentFormOpen}
        onClose={closeAssignmentForm}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={assignmentFormOpen}>
          <Box
            className="modal-common-styling"
            style={{ padding: "40px", maxHeight: "80vh", minWidth: "500px" }}
          >
            <AssignmentForm
              userID={userID}
              courseID={courseID}
              courseTitle={courseTitle}
              modules={modules}
              moduleIndex={moduleIndex}
              closeAssignmentForm={closeAssignmentForm}
            />
          </Box>
        </Fade>
      </Modal>

      <Modal
        className="flex-center-all"
        open={resourceFormOpen}
        onClose={closeResourceForm}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={resourceFormOpen}>
          <Box className="modal-form-v1 modal-common-styling">
            <ResourceForm
              userID={userID}
              courseID={courseID}
              modules={modules}
              moduleIndex={moduleIndex}
              closeResourceForm={closeResourceForm}
            />
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
