import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormGroup,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@material-ui/core";
import AddQuestionSet from "./AddQuestionSet.jsx";
import CreateFolderInQuestionSetCollection from "./CreateFolderInQuestionSetCollection.jsx";
import MyQuestionSets from "./MyQuestionSets.jsx";
import MyLibrary from "./MyLibrary.jsx";
import ProductLibraries from "./ProductLibraries.jsx";
import BrowseLibraries from "./BrowseLibraries.jsx";
import EditQuestionSetTitle from "./EditQuestionSetTitle.jsx";
import {
  deleteQuestionSet,
  addQuestionSetToFolder,
  removeQuestionSetFromFolder,
  updateQuestionSetFolderProperties,
} from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import {
  artificialDelay,
  capitalizeFirstLetter,
  cloneQuestionSet,
} from "../../app/utils/utils.js";
import { TreeView, TreeItem } from "@material-ui/lab";
import {
  ChevronRight,
  Clear,
  FileCopy,
  Edit,
  ExpandMore,
  Folder,
  MenuBook,
} from "@material-ui/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function QuestionSubpage({
  userDisplayName,
  userEmail,
  userID,
  userPermissions,
}) {
  const [view, setView] = useState("");
  const [myQuestionSets, setMyQuestionSets] = useState([]);
  const [myInUseQuestionSets, setMyInUseQuestionSets] = useState([]);
  const [myInUseQuestionSetsCourses, setMyInUseQuestionSetsCourses] = useState(
    []
  );
  const [showAll, setShowAll] = useState(true);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedTreeItemData, setSelectedTreeItemData] = useState({});
  const [selected, setSelected] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const questionSets = [...myQuestionSets, ...sharedWithMe];
  const authorizedEditor = userPermissions?.includes("editQuestionLibraries");

  const deleteFolder = (folder) => {
    if (folder?.children) {
      folder.children.forEach((qSet) => {
        deleteQuestionSet(qSet.id, userID);
      });
    }
    deleteQuestionSet(folder.id, userID);
  };

  const handleClose = () => {
    setConfirmDeleteOpen(false);
  };

  const deleteSelectedTreeItem = () => {
    artificialDelay(500).then(() => {
      deleteTreeNode(selectedTreeItemData);
    });
    setSelectedTreeItemData({});
    setConfirmDeleteOpen(false);
  };

  const getTreeItemsFromData = (treeItems) => {
    return treeItems.map((treeItemData, index) => {
      let children = undefined;
      if (treeItemData.children && treeItemData.children?.length > 0) {
        children = getTreeItemsFromData(treeItemData.children);
      }
      return (
        <Draggable
          key={treeItemData.title + index}
          draggableId={treeItemData.id}
          index={index}
          style={{ paddingTop: "10px", paddingBottom: "10px" }}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <TreeItem
                key={treeItemData.id}
                nodeId={treeItemData.id}
                label={
                  <div>
                    {treeItemData.title}
                    {treeItemData?.inUse && (
                      <span
                        style={{
                          color: "gray",
                          fontStyle: "italic",
                          marginLeft: "15px",
                        }}
                      >
                        (
                        {treeItemData.inUse.courseTitle
                          ? treeItemData.inUse.courseTitle
                          : treeItemData.inUse}
                        )
                      </span>
                    )}
                    <Tooltip
                      title={
                        <Typography variant="caption">
                          {treeItemData.type !== "Folder"
                            ? "Delete Question Set"
                            : "Delete Folder"}
                        </Typography>
                      }
                      placement="top-start"
                    >
                      <IconButton
                        style={{ float: "right", padding: "5px" }}
                        onClick={() => {
                          setConfirmDeleteOpen(true);
                          setSelectedTreeItemData(treeItemData);
                        }}
                      >
                        <Clear
                          style={{
                            height: "15px",
                            width: "15px",
                            marginRight: "5px",
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                    {treeItemData.type !== "Folder" && (
                      <Tooltip
                        title={
                          <Typography variant="caption">
                            Clone Question Set
                          </Typography>
                        }
                        placement="top-start"
                      >
                        <IconButton
                          style={{ float: "right", padding: "5px" }}
                          onClick={() => {
                            cloneQuestionSet(
                              userID,
                              "/user_questions/" +
                                userID +
                                "/my_question_sets/" +
                                treeItemData.id
                            );
                          }}
                        >
                          <FileCopy
                            style={{
                              height: "15px",
                              width: "15px",
                              marginRight: "5px",
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                    {treeItemData.type !== "Folder" && (
                      <Tooltip
                        title={
                          <Typography variant="caption">
                            Edit Question Set Title
                          </Typography>
                        }
                        placement="top-start"
                      >
                        <IconButton
                          style={{ float: "right", padding: "5px" }}
                          onClick={() => {
                            setEditTitleModalOpen(true);
                            setSelectedQuestionSet(treeItemData);
                          }}
                        >
                          <Edit
                            style={{
                              height: "15px",
                              width: "15px",
                              marginRight: "5px",
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                }
                icon={treeItemData?.type === "Folder" ? <Folder /> : null}
                children={children}
                onClick={() => {
                  if (treeItemData?.type !== "Folder")
                    displayQuestionSetNew(treeItemData);
                }}
                style={{ paddingTop: "5px", marginTop: "5px" }}
              />
            </div>
          )}
        </Draggable>
      );
    });
  };

  function deleteTreeNode(treeItemData) {
    if (treeItemData?.type === "Folder") {
      deleteFolder(treeItemData);
      return;
    }
    treeItemData?.parentID
      ? removeQuestionSetFromFolder(treeItemData.id, treeItemData.parentID)
      : handleDeleteQuestionSet(
          myQuestionSets
            .concat(myInUseQuestionSets)
            .find((qSet) => qSet.id === treeItemData.id)
        );
  }

  function onHover(event) {
    console.log("hover" + JSON.stringify(event));
  }

  function onDragEnd(result) {
    const { combine, destination, draggableId, source } = result;

    const notReordered =
      destination?.droppableId === source?.droppableId &&
      destination?.index === source?.index - 1;

    if (!destination && !combine) return;
    if (notReordered) return;

    // Prevent ability to add a folder to a folder
    if (
      myQuestionSets.find(
        (qSet) => qSet.id === draggableId && qSet?.type === "Folder"
      )
    ) {
      return;
    }

    // Check if Dropped into folder
    if (
      combine &&
      myQuestionSets.find(
        (qSet) => qSet?.type === "Folder" && qSet.id === combine.draggableId
      )
    ) {
      addQuestionSetToFolder(
        userID,
        draggableId,
        combine.draggableId,
        myQuestionSets
          .concat(myInUseQuestionSets)
          .find((qSet) => qSet.id === draggableId).title,
        myQuestionSets
          .concat(myInUseQuestionSets)
          .find((qSet) => qSet.id === draggableId)?.inUse?.courseTitle
      );
      updateQuestionSetFolderProperties(
        userID,
        draggableId,
        true,
        combine.draggableId,
        myQuestionSets
          .concat(myInUseQuestionSets)
          .find((qSet) => qSet.id === combine.draggableId).title,
        myQuestionSets
          .concat(myInUseQuestionSets)
          .find((qSet) => qSet.id === draggableId)?.inUse?.courseTitle
      );
      return;
    }

    //Moved to root, remove isChild status and parent props
    if (myQuestionSets.find((qSet) => qSet.id === draggableId)?.isChild) {
      removeQuestionSetFromFolder(
        userID,
        draggableId,
        myQuestionSets.find((qSet) => qSet.id === draggableId).parentID, //Folder ID
        myQuestionSets.find((qSet) => qSet.id === draggableId).title,
        myQuestionSets.find((qSet) => qSet.id === draggableId).inUse
      );
      updateQuestionSetFolderProperties(userID, draggableId, false);
      return;
    }
  }

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
  };

  const DataTreeView = ({ treeItems }) => {
    return (
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onHover}>
        <TreeView
          style={{ marginLeft: "10px" }}
          selected={selected}
          onNodeSelect={handleSelect}
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
        >
          <Droppable droppableId="droppable" isCombineEnabled>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {getTreeItemsFromData(treeItems)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </TreeView>
      </DragDropContext>
    );
  };

  function sortChildrenByTitle(doc) {
    return doc.data()?.children?.sort((a, b) => {
      let x = a.title.toLowerCase();
      let y = b.title.toLowerCase();
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    });
  }

  function fetchMyQuestionSets() {
    const ref = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .orderBy("title");
    ref.onSnapshot((querySnapshot) => {
      const questionSets = [];
      querySnapshot.forEach((doc) => {
        questionSets.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      const inUseAndFolderQuestionSets = questionSets.filter((item) => {
        return item.inUse || item.type === "Folder";
      });

      setMyInUseQuestionSets((prevState) =>
        sortFolderToTopOfQuestionSets(inUseAndFolderQuestionSets)
      );
      setMyInUseQuestionSetsCourses((prevState) => inUseAndFolderQuestionSets);

      setMyQuestionSets((prevState) =>
        sortFolderToTopOfQuestionSets(
          questionSets.filter((item) => {
            return !item.inUse || item.type === "Folder";
          })
        )
      );
    });

    function sortFolderToTopOfQuestionSets(inUseAndFolderQuestionSets) {
      const filteredItemsWithType = inUseAndFolderQuestionSets.filter(
        (item) => {
          return item.type !== undefined;
        }
      );

      const filteredItemsWithoutType = inUseAndFolderQuestionSets.filter(
        (item) => {
          return item.type === undefined;
        }
      );

      const sortedItems = filteredItemsWithType.concat(
        filteredItemsWithoutType
      );
      return sortedItems;
    }
  }

  function fetchSharedQuestionSetRefs() {
    const sharedRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("shared_question_sets");
    sharedRef.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
          shared: true,
        });
      });
      setSharedWithMe((prevState) => fetchedItems);
    });
  }

  async function fetchSharedQuestionSet(questionSet) {
    const { ownerID, questionSetID } = questionSet;
    const ownerQSetRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(ownerID)
      .collection("my_question_sets")
      .doc(questionSetID);
    const snapshot = await ownerQSetRef.get();
    setSelectedQuestionSet(() => ({ ...snapshot.data(), shared: true }));
  }

  function displayQuestionSetNew(questionSet) {
    const { shared } = questionSet;
    setView("my question sets");
    if (shared) fetchSharedQuestionSet(questionSet);

    //To maintain a single point of truth, children question sets are stored in the root level, not in the Folder > Child element
    questionSet = questionSet?.isChild
      ? myQuestionSets.find((qSet) => qSet.id === questionSet.id)
      : questionSet;
    if (!shared) setSelectedQuestionSet(questionSet);
  }

  function handleDeleteQuestionSet(questionSet) {
    if (!questionSet) {
      return;
    }

    if (questionSet?.id === selectedQuestionSet?.id) {
      setSelectedQuestionSet(null);
    }

    if (questionSet?.parentID) {
      removeQuestionSetFromFolder(
        userID,
        questionSet.id,
        questionSet.parentID,
        questionSet.title,
        questionSet.inUse
      );
    }

    if (questionSet?.clonedFrom?.length > 0) {
      removeClonedToInParentQuestionSet(
        userID,
        questionSet.id,
        questionSet.clonedFrom
      );
    }

    if (questionSet?.inUse?.courseID) {
      removeReferencesToQuestionSetInCourse(
        userID,
        questionSet.inUse.courseID,
        questionSet.id
      );
    }

    deleteQuestionSet(questionSet.id, userID);
  }
  function deleteContent(courseID, modules, questionSetID) {
    modules?.forEach((module, moduleIndex) => {
      module?.content?.forEach((content, contentIndex) => {
        if (
          content?.docRef ===
          "user_questions/" + userID + "/my_question_sets/" + questionSetID
        ) {
          modules[moduleIndex].content.splice(contentIndex, 1);
          firebase
            .firestore()
            .collection("courses")
            .doc(courseID)
            .update({ modules });
        }
      });
    });
  }

  async function removeClonedToInParentQuestionSet(
    userID,
    questionSetID,
    clonedFrom
  ) {
    const parentQuestionSetRef = firebase.firestore().doc(clonedFrom);
    const questionSet = await parentQuestionSetRef.get();

    if (questionSet?.data()?.clonedTo.length > 0) {
      const clonedTo = questionSet
        .data()
        .clonedTo.filter(
          (qSetPath) =>
            qSetPath !==
            "user_questions/" + userID + "/my_question_sets/" + questionSetID
        );
      parentQuestionSetRef.update({ clonedTo });
    }
  }

  async function removeReferencesToQuestionSetInCourse(
    userID,
    courseID,
    questionSetID
  ) {
    const [courseDoc, assignmentDocs] = await Promise.all([
      fetchCourse(courseID),
      fetchAssignmentsUsingQuestionSet(courseID, userID, questionSetID),
    ]);

    if (courseDoc) {
      deleteContent(courseID, courseDoc.data()?.modules, questionSetID);
    }

    if (assignmentDocs) {
      assignmentDocs.forEach((doc) => {
        doc.ref.delete();
      });
    }
  }

  async function fetchAssignmentsUsingQuestionSet(
    courseID,
    userID,
    questionSetID
  ) {
    const assignmentRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .where(
        "docRef",
        "==",
        "user_questions/" + userID + "/my_question_sets/" + questionSetID
      )
      .get();

    let assignmentDocs = await assignmentRef;
    return assignmentDocs;
  }

  async function fetchCourse(courseID) {
    const courseRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .get();

    let courseDoc = await courseRef;
    return courseDoc;
  }

  async function fetchPermissionRequests() {
    // const fetchedItems = [];
    const ref = firebase.firestore().collection("permission_requests");

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setPermissionRequests((prevState) => fetchedItems);
    });
  }

  function getUniqueQuestionSetInUseCourses() {
    let inUseQuestionSets = myInUseQuestionSetsCourses
      .filter((qSet) => qSet.inUse)
      .map((questionSet) => {
        return {
          id: questionSet.inUse.courseID,
          courseTitle: questionSet.inUse.courseTitle,
        };
      });

    let unique = [];
    let distinct = [];
    for (let i = 0; i < inUseQuestionSets.length; i++) {
      if (!unique[inUseQuestionSets[i].id]) {
        distinct.push({
          id: inUseQuestionSets[i].id,
          courseTitle: inUseQuestionSets[i].courseTitle,
        });
        unique[inUseQuestionSets[i].id] = 1;
      }
    }

    return distinct;
  }

  useEffect(() => {
    const unsubscribe = setSelectedQuestionSet(() =>
      selectedQuestionSet
        ? getQSetFromSelectedQSet(
            myQuestionSets,
            myInUseQuestionSets,
            selectedQuestionSet
          )
        : null
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, [myQuestionSets, myInUseQuestionSets]);

  useEffect(() => {
    const unsubscribe = fetchMyQuestionSets();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchSharedQuestionSetRefs();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  // useEffect(() => fetchPermissionRequests(), []);
  useEffect(() => {
    const unsubscribe = fetchPermissionRequests();
    return unsubscribe;
  }, []);

  return (
    <Box className="display-area flex-column">
      <QuestionSubpageHeader view={view} />
      {authorizedEditor && (
        <PendingRequests permissionRequests={permissionRequests} />
      )}

      {view === "my question sets" && selectedQuestionSet?.id && (
        <MyQuestionSets
          selectedQuestionSet={selectedQuestionSet}
          setSelectedQuestionSet={setSelectedQuestionSet}
          userID={userID}
          userPermissions={userPermissions}
        />
      )}
      {view === "my library" && <MyLibrary userID={userID} />}
      {view === "edit question libraries" && <ProductLibraries />}
      {view === "readonly question libraries" && (
        <ProductLibraries readonly={true} />
      )}

      <Box
        width="700px"
        style={{ marginTop: "20px", backgroundColor: "rgba(245,245,245,0.5)" }}
      >
        <Box className="flex-center-all padding-light">
          <AddQuestionSet userID={userID} />
          <VerticalSpacerLight />
          <CreateFolderInQuestionSetCollection userID={userID} />
          <VerticalSpacer />
          <Button
            type="button"
            onClick={() => setView("my library")}
            startIcon={<MenuBook />}
          >
            My Library
          </Button>
          <VerticalSpacerLight />
          {!authorizedEditor && (
            <>
              {/* <BrowseLibraries
                permissionRequests={permissionRequests}
                userDisplayName={userDisplayName}
                userEmail={userEmail}
                userID={userID}
                userPermissions={userPermissions}
              /> */}
              <Button
                type="button"
                onClick={() => setView("readonly question libraries")}
                startIcon={<AppIcon />}
              >
                {process.env.REACT_APP_PRODUCT} Library
              </Button>
            </>
          )}
          {authorizedEditor && (
            <Button
              type="button"
              onClick={() => setView("edit question libraries")}
              startIcon={<AppIcon />}
            >
              {process.env.REACT_APP_PRODUCT} Library
            </Button>
          )}
          <Divider />
        </Box>
        <hr />
        <br />
        <Box style={{ float: "left" }}>
          <InputLabel
            id="courseSelectLabel"
            style={{
              float: "left",
              marginTop: "10px",
              marginRight: "10px",
              marginLeft: "30px",
            }}
          >
            Filter By Course
          </InputLabel>
          <Select
            labelId="courseSelectLabel"
            id="courseSelect"
            displayEmpty={true}
            style={{ width: "200px", border: "1px solid lightGrey" }}
            value={selectedCourse}
            label="Filter Question Sets by Course"
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              e.target.value === "AllCourses"
                ? setMyInUseQuestionSets(myInUseQuestionSetsCourses)
                : setMyInUseQuestionSets(
                    myInUseQuestionSetsCourses.filter(
                      (qSet) => qSet.inUse?.courseID === e.target.value
                    )
                  );
            }}
          >
            <MenuItem value="placeholder" disabled>
              <Typography color="textSecondary">select a course</Typography>
            </MenuItem>
            <MenuItem value="AllCourses">
              <Typography>All Courses</Typography>
            </MenuItem>
            {getUniqueQuestionSetInUseCourses().map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.courseTitle.slice(0, 30)}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <FormGroup style={{ float: "right" }}>
          <FormControlLabel
            control={
              <Checkbox
                color="default"
                checked={showAll}
                onChange={(event) => setShowAll(event.target.checked)}
              />
            }
            label="Show Unassigned"
          />
        </FormGroup>
        <br />
        <br />
        {myInUseQuestionSets.length > 0 && (
          <>
            <br />
            <hr />
            <br />
            <DataTreeView
              treeItems={myInUseQuestionSets.filter(
                (qSet) => !qSet?.isChild && qSet.type !== "Folder"
              )}
            />
          </>
        )}
        <br />

        {showAll &&
          myQuestionSets.filter((qSet) => !qSet?.isChild).length > 0 && (
            <>
              <hr />
              <Typography
                variant="h6"
                style={{
                  marginLeft: "30px",
                  textDecoration: "underline",
                  fontSize: "1.1rem",
                }}
              >
                Unassigned Question Sets
              </Typography>

              <DataTreeView
                treeItems={myQuestionSets.filter((qSet) => {
                  return !qSet?.isChild;
                })}
              />
            </>
          )}
      </Box>
      <ConfirmQuestionSetDelete
        selectedTreeItemData={selectedTreeItemData}
        confirmDeleteOpen={confirmDeleteOpen}
        handleClose={handleClose}
        deleteSelectedTreeItem={deleteSelectedTreeItem}
      />
      <EditQuestionSetTitle
        questionSetID={selectedQuestionSet?.id}
        title={selectedQuestionSet?.title}
        parentID={selectedQuestionSet?.parentID}
        userID={userID}
        open={editTitleModalOpen}
        setOpen={setEditTitleModalOpen}
        inUse={selectedQuestionSet?.inUse}
      />
    </Box>
  );
}

function getQSetFromSelectedQSet(
  myQuestionSets,
  myInUseQuestionSets,
  selectedQuestionSet
) {
  const myQuestionSet = myQuestionSets.find(
    (qSet) => qSet.id === selectedQuestionSet.id
  );

  const myInUseQuestionSet = myInUseQuestionSets.find(
    (qSet) => qSet.id === selectedQuestionSet.id
  );

  if (myQuestionSet) {
    return myQuestionSet;
  }

  if (myInUseQuestionSet) {
    return myInUseQuestionSet;
  }

  return null;
}

function ConfirmQuestionSetDelete({
  selectedTreeItemData,
  confirmDeleteOpen,
  handleClose,
  deleteSelectedTreeItem,
}) {
  return (
    <Dialog open={confirmDeleteOpen} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">{`Delete ${
        selectedTreeItemData.type ? selectedTreeItemData.type : "Question Set"
      }`}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {selectedTreeItemData?.inUse
            ? warnUserOfCoursesUsingQuestionSet(selectedTreeItemData.inUse)
            : ""}
          {selectedTreeItemData.type
            ? "This will delete the folder and all question sets within it.  "
            : "This will delete the question set and any course assignments associated with it.  "}
          Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={deleteSelectedTreeItem}
          variant="contained"
          style={{ backgroundColor: "rgb(211, 47, 47)", color: "white" }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  function warnUserOfCoursesUsingQuestionSet(inUse) {
    return (
      <span
        style={{
          color: "red",
        }}
      >
        <Typography>
          Warning - This question set is being used by the following course:{" "}
          <br />
          <span style={{ color: "black" }}>{inUse.courseTitle}</span>
        </Typography>
        <br />
      </span>
    );
  }
}

const AppIcon = () => (
  <img
    src={process.env.REACT_APP_LIBRARY_IMAGE}
    style={{
      width: "18px",
      verticalAlign: "bottom",
    }}
    alt="product library"
  />
);

const VerticalSpacer = () => (
  <Typography
    display="inline"
    style={{ marginLeft: "25px", marginRight: "25px" }}
  >
    |
  </Typography>
);

const VerticalSpacerLight = () => (
  <Typography
    display="inline"
    style={{ marginLeft: "5px", marginRight: "5px", color: "lightgrey" }}
  >
    |
  </Typography>
);

function QuestionSubpageHeader({ view }) {
  return (
    <Box className="subpage-header">
      <Typography variant="h3" color="primary">
        {getHeaderText(view)}
      </Typography>
    </Box>
  );
}

function PendingRequests({ permissionRequests }) {
  const [viewOpen, setViewOpen] = useState(false);
  if (permissionRequests.length === 0) return null;

  if (!viewOpen)
    return (
      <Box className="flex-align-center padding-medium">
        <Typography style={{ marginRight: "10px" }}>
          {permissionRequests.length} pending library access{" "}
          {permissionRequests.length > 1 ? "requests" : "request"}
        </Typography>
        <Button variant="contained" onClick={() => setViewOpen(true)}>
          View
        </Button>
      </Box>
    );

  return (
    permissionRequests.length > 0 &&
    permissionRequests.map((request) => (
      <Box style={{ marginLeft: "10px" }}>
        <Typography variant="h6">
          {request?.userDisplayName} has requested access to{" "}
          {request?.libraryTitle} (ID: {request.libraryID})
        </Typography>

        <Typography>
          <em>request details</em>
        </Typography>
        <Typography>user email: {request?.userEmail}</Typography>
        <Typography>user id: {request?.userID}</Typography>
        <Typography>institution: {request?.institution}</Typography>
        <Typography>institution email: {request?.institutionEmail}</Typography>
        <Typography>
          requested:{" "}
          {new Date(request?.requested?.seconds * 1000)?.toLocaleString()}
        </Typography>
        <Box width="200px" style={{ marginTop: "5px", marginBottom: "20px" }}>
          <Button
            onClick={() => grantLibraryPermission(request)}
            variant="contained"
            fullWidth
          >
            Grant Access
          </Button>
        </Box>
      </Box>
    ))
  );
}

async function grantLibraryPermission(request) {
  const userID = request?.userID;
  const libraryID = request?.libraryID;
  await firebase
    .firestore()
    .collection("users")
    .doc(userID)
    .update({
      permissions: firebase.firestore.FieldValue.arrayUnion(libraryID),
    })
    .then(() => deleteFulfilledPermissionRequest(request));
}

async function deleteFulfilledPermissionRequest(request) {
  await firebase
    .firestore()
    .collection("permission_requests")
    .doc(request.id)
    .delete();
}

function getHeaderText(view) {
  if (!view) return "Questions";
  switch (view) {
    case "my question sets":
      return "Question Set";
    case "my library":
      return "My Library";
    case "browse question libraries":
      return "Community Libraries";
    case "edit question libraries":
      return `${capitalizeFirstLetter(
        process.env.REACT_APP_PRODUCT
      )} Libraries`;
    default:
      return "no header";
  }
}
