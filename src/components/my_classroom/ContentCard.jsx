import React, { useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  CardContent,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
  Modal,
  Typography,
  Tooltip,
} from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import {
  Block,
  CheckCircleOutline,
  MenuBook,
  WatchLater,
} from "@material-ui/icons";
import { deleteContentFromModule } from "../../app/firestoreClient.js";
import ResourceForm from "./ResourceForm.jsx";
import AssignmentForm from "./AssignmentForm.jsx";

export default function ContentCard({
  userID,
  courseID,
  courseTitle,
  item,
  modules,
  moduleIndex,
  content,
  contentIndex,
}) {
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmMinimalDeleteOpen, setConfirmMinimalDeleteOpen] =
    useState(false);
  const [contentVisible, setContentVisible] = useState(
    content[contentIndex]?.visible ||
      content[contentIndex]?.visible === undefined
      ? true
      : false
  );

  const closeResourceForm = () => {
    setResourceFormOpen(false);
  };

  const closeAssignmentForm = () => {
    setAssignmentFormOpen(false);
  };

  const handleClose = () => {
    setConfirmDeleteOpen(false);
  };

  const handleMinimalClose = () => {
    setConfirmMinimalDeleteOpen(false);
  };

  const deleteAssignmentContentConfirmed = () => {
    deleteAssignmentContent(
      content,
      contentIndex,
      courseID,
      modules,
      moduleIndex
    );
    setConfirmDeleteOpen(false);
    setConfirmMinimalDeleteOpen(false);
  };

  const openModuleContentEditor = () => {
    switch (item.contentType) {
      case "resource":
        setResourceFormOpen(true);
        break;
      case "assignment":
        setAssignmentFormOpen(true);
        break;
      default:
        break;
    }
  };

  async function handlePublish(content, contentIndex, courseID) {
    const updatedModules = updateModuleContentVisibility(content, contentIndex);
    await updateContentVisibility(courseID, updatedModules);
    setContentVisible(!contentVisible);
  }

  function updateModuleContentVisibility(content, contentIndex) {
    const updatedContent = content.map((content, index) => {
      if (index === contentIndex) {
        content.visible =
          content?.visible === undefined ? false : !content.visible;
      }
      return content;
    });
    const updatedModules = modules.map((module, index) => {
      if (index === moduleIndex) {
        module.content = updatedContent;
      }
      return module;
    });
    return updatedModules;
  }

  async function updateContentVisibility(courseID, updatedModules) {
    await firebase.firestore().collection("courses").doc(courseID).update({
      modules: updatedModules,
    });
    return true;
  }

  return (
    <>
      <CardActionArea onClick={openModuleContentEditor}>
        <CardContent>
          <Box style={{ width: "580px" }} className="flex align-top">
            <Box className="flex justify-center" minWidth="50px" pt="2px">
              {item.contentType === "assignment" && (
                <WatchLater style={{ paddingTop: "2px" }} color="disabled" />
              )}
              {item.contentType === "resource" && <MenuBook color="disabled" />}
            </Box>
            <Box>
              <Typography display="inline" variant="subtitle1">
                {item.title || item.name}
              </Typography>
              <Typography
                color="textSecondary"
                display="inline"
                style={{
                  marginLeft: "15px",
                  marginRight: "15px",
                }}
              >
                |
              </Typography>
              <Typography display="inline" color="primary">
                {item.itemType}
              </Typography>

              {item.contentType === "assignment" && (
                <TimeSettings
                  hasDueDate={item.hasDueDate}
                  hasOpenDate={item.hasOpenDate}
                  due={item.due}
                  open={item.open}
                />
              )}
              {item.itemType === "link" && (
                <Typography
                  style={{ maxWidth: "550px" }}
                  noWrap
                  color="textSecondary"
                >
                  {item.url}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
      <ConfirmQuestionSetDelete
        selectedItem={item}
        confirmDeleteOpen={confirmDeleteOpen}
        handleClose={handleClose}
        deleteSelectedItem={deleteAssignmentContentConfirmed}
      />
      <ConfirmMinimalDelete
        selectedItem={item}
        confirmMinimalDeleteOpen={confirmMinimalDeleteOpen}
        handleClose={handleMinimalClose}
        deleteSelectedItem={deleteAssignmentContentConfirmed}
      />
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
          <Box
            className="modal-common-styling"
            style={{ padding: "40px", maxHeight: "80vh", minWidth: "500px" }}
          >
            <ResourceForm
              userID={userID}
              courseID={courseID}
              modules={modules}
              moduleIndex={moduleIndex}
              content={content}
              contentIndex={contentIndex}
              closeResourceForm={closeResourceForm}
              item={item}
              edit={true}
            />
          </Box>
        </Fade>
      </Modal>
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
              content={content}
              contentIndex={contentIndex}
              closeAssignmentForm={closeAssignmentForm}
              item={item}
              edit={true}
            />
          </Box>
        </Fade>
      </Modal>
      {contentVisible && (
        <Tooltip title="Unpublish" placement="top">
          <CheckCircleOutline
            onClick={() => handlePublish(content, contentIndex, courseID)}
            color="primary"
            style={{
              cursor: "pointer",
              height: "15px",
              width: "15px",
              marginTop: "22px",
            }}
          />
        </Tooltip>
      )}
      {!contentVisible && (
        <Tooltip title="Publish" placement="top">
          <Block
            onClick={() => handlePublish(content, contentIndex, courseID)}
            color="disabled"
            style={{
              cursor: "pointer",
              height: "15px",
              width: "15px",
              marginTop: "22px",
            }}
          />
        </Tooltip>
      )}
      <Box className="padding-x-light flex-align-center">
        <Tooltip title="Delete" placement="top">
          <button
            className="delete-button padding-tiny hover-pointer-blue"
            onClick={() => {
              item.contentType === "assignment"
                ? setConfirmDeleteOpen(true)
                : setConfirmMinimalDeleteOpen(true);
            }}
          >
            X
          </button>
        </Tooltip>
      </Box>
    </>
  );
}

function ConfirmQuestionSetDelete({
  selectedItem,
  confirmDeleteOpen,
  handleClose,
  deleteSelectedItem,
}) {
  return (
    <Dialog open={confirmDeleteOpen} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">Delete Assignment</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {selectedItem?.firstResultSubmitted
            ? warnUserOfCoursesUsingQuestionSet(selectedItem.inUse)
            : ""}
          This will delete the assignment and all results that have been
          submitted. Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={deleteSelectedItem}
          variant="contained"
          style={{ backgroundColor: "rgb(211, 47, 47)", color: "white" }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmMinimalDelete({
  selectedItem,
  confirmMinimalDeleteOpen,
  handleClose,
  deleteSelectedItem,
}) {
  return (
    <Dialog open={confirmMinimalDeleteOpen} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">Delete Resource</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {selectedItem?.firstResultSubmitted
            ? warnUserOfCoursesUsingQuestionSet(selectedItem.inUse)
            : ""}
          Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={deleteSelectedItem}
          variant="contained"
          style={{ backgroundColor: "rgb(211, 47, 47)", color: "white" }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function warnUserOfCoursesUsingQuestionSet(inUse) {
  return (
    <span
      style={{
        color: "red",
      }}
    >
      <Typography>
        Warning - This assignment already has results submitted.
        <br />
      </Typography>
      <br />
    </span>
  );
}

async function deleteAssignmentContent(
  content,
  contentIndex,
  courseID,
  modules,
  moduleIndex
) {
  if (
    content[contentIndex].contentType === "assignment" &&
    content[contentIndex]?.docRef
  ) {
    const questionSetRef = firebase
      .firestore()
      .doc(content[contentIndex]?.docRef);

    const questionSet = await questionSetRef.get();

    if (questionSet.exists) {
      const questionSetTitle = questionSet.data().title;

      await questionSetRef.update({
        inUse: null,
        title: questionSetTitle,
      });
    }
  }

  deleteContent(courseID, modules, moduleIndex, content, contentIndex);
}

function deleteContent(courseID, modules, moduleIndex, content, contentIndex) {
  const updatedContent = content.filter(
    (element, index) => index !== contentIndex
  );
  const updatedModules = modules.map((element, index) => {
    if (index === moduleIndex) {
      element.content = updatedContent;
    }
    return element;
  });
  deleteContentFromModule(courseID, updatedModules);
}

function TimeSettings({ due, hasDueDate, hasOpenDate, open }) {
  if (!hasOpenDate && hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"due " + parseDate(due) + " at " + parseTime(due)}
      </Typography>
    );
  }

  if (hasOpenDate && !hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"open " + parseDate(open) + " at " + parseTime(open)}
      </Typography>
    );
  }

  if (hasOpenDate && hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"open " +
          parseDate(open) +
          " at " +
          parseTime(open) +
          ", " +
          " due " +
          parseDate(due) +
          " at " +
          parseTime(due)}
      </Typography>
    );
  }

  if (!hasOpenDate && !hasDueDate) {
    return null;
  }
  return null;
}

function parseDate(seconds) {
  const ms = seconds * 1000;
  const format = {
    day: "numeric",
    month: "short",
  };
  return new Date(ms).toLocaleDateString("en-us", format);
}

function parseTime(seconds) {
  const ms = seconds * 1000;

  const format = {
    hour: "numeric",
    minute: "numeric",
  };
  return new Date(ms).toLocaleTimeString("en-US", format);
}
