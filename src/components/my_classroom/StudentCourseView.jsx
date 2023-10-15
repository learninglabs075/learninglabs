import React, { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  Link,
  List,
  ListItem,
  ListItemText,
  MobileStepper,
  Modal,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { updateCourseModuleContent } from "../../app/firestoreClient.js";
import { ThemeProvider } from "@material-ui/core/styles";
import { ChevronLeft } from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import { MyClassroomTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import { useHistory } from "react-router-dom";
import firebase from "../../app/config/firebaseConfig.js";
import { WatchLater, MenuBook } from "@material-ui/icons";
import StudentUpload from "./StudentUpload.jsx";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { ZoomControl } from "../../app/utils/utils.js";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import StudentGradebook from "./StudentGradebook.jsx";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const options = {
  cMapUrl: "cmaps/",
  cMapPacked: true,
};

function restrictUnauthorizedAccess(user, history, instructors, students) {
  const isInstructor = instructors?.some(
    (instructor) => instructor.id === user.uid
  );

  const isStudent = students?.some((student) => student.id === user.uid);

  if (instructors && students) {
    if (isInstructor || isStudent) {
      return;
    } else {
      history.push("/access_restricted");
    }
  }
}

export default function StudentCourseView({ match }) {
  const { currentUser } = useAuth();
  const history = useHistory();
  const courseID = match.params.courseID;
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(-1);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [selectedStudentUpload, setSelectedStudentUpload] = useState(null);
  const [courseInfo, setCourseInfo] = useState({});
  const { modules } = courseInfo;

  useEffect(() => {
    const unsubscribe = fetchCourseInfo(courseID, setCourseInfo);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedModuleIndex < 0) return;
    if (selectedItemIndex < 0) return;
    setSelectedItem(modules[selectedModuleIndex].content[selectedItemIndex]);
    // eslint-disable-next-line
  }, [courseInfo]);

  useEffect(() => {
    if (!selectedItem) return;

    selectedItem.itemType === "question set" &&
      fetchQuestionSet(selectedItem.docRef, setSelectedQuestionSet);

    selectedItem.itemType !== "question set" && setSelectedQuestionSet(null);

    if (selectedItem.itemType === "student upload")
      fetchStudentUpload(
        courseID,
        selectedItem.assignmentID,
        setSelectedStudentUpload
      );
    if (selectedItem.itemType !== "student upload")
      setSelectedStudentUpload(null);

    // eslint-disable-next-line
  }, [selectedItem]);

  restrictUnauthorizedAccess(
    currentUser,
    history,
    courseInfo.instructors,
    courseInfo.students
  );

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="course-view-background">
        <MainNavBar />
        <Box className="flex-row display-area-full">
          <Box className="course-content-menu">
            <Button
              startIcon={<ChevronLeft />}
              onClick={() => history.push("/classroom")}
            >
              BACK TO COURSES
            </Button>
            <Typography className="course-my-grades-link">
              <Button
                onClick={() => {
                  setSelectedItem({ itemType: "studentGradebook" });
                }}
              >
                My Grades
              </Button>
            </Typography>
            <Typography variant="h5" className="course-title">
              {courseInfo.title}
            </Typography>
            {modules?.map(
              (module, moduleIndex) =>
                (module?.visible || module?.visible === undefined) &&
                module?.content?.length > 0 && (
                  <List key={moduleIndex}>
                    <ListItem style={{ paddingBottom: "0" }} divider={true}>
                      <ListItemText secondary={module.title} />
                    </ListItem>
                    {module.content?.map(
                      (item, itemIndex) =>
                        (item?.visible || item?.visible === undefined) && (
                          <ListItem
                            key={itemIndex}
                            button
                            selected={
                              moduleIndex === selectedModuleIndex &&
                              itemIndex === selectedItemIndex
                            }
                            onClick={() => {
                              setSelectedModuleIndex(moduleIndex);
                              setSelectedItemIndex(itemIndex);
                              setSelectedItem(
                                modules[moduleIndex].content[itemIndex]
                              );
                            }}
                          >
                            <Box className="content-type-icon">
                              {item.contentType === "resource" && (
                                <MenuBook color="disabled" />
                              )}
                              {item.contentType === "assignment" && (
                                <WatchLater color="disabled" />
                              )}
                            </Box>
                            <ListItemText
                              primary={
                                item.title?.slice(0, 30) ||
                                item.name?.slice(0, 30)
                              }
                              secondary={
                                item.contentType === "assignment" && (
                                  <AssignmentTimeSettings item={item} />
                                )
                              }
                            />
                          </ListItem>
                        )
                    )}
                  </List>
                )
            )}
          </Box>

          <Box
            className={
              (selectedItem?.itemType !== "studentGradebook"
                ? "flex-center-all"
                : "") + " item-display-area"
            }
          >
            {selectedItem && (
              <DisplayedItem
                courseInfo={courseInfo}
                currentUser={currentUser}
                selectedItem={selectedItem}
                selectedItemIndex={selectedItemIndex}
                selectedModuleIndex={selectedModuleIndex}
                selectedQuestionSet={selectedQuestionSet}
                selectedStudentUpload={selectedStudentUpload}
              />
            )}
          </Box>
          <ClassAlert courseInfo={courseInfo} currentUser={currentUser} />
        </Box>
      </div>
    </ThemeProvider>
  );
}

function ClassAlert({ courseInfo, currentUser }) {
  const studentInfo = courseInfo?.students?.find(
    (el) => el?.id === currentUser?.uid
  );
  const [open, setOpen] = useState(false);
  const [organizationUserID, setOrganizationUserID] = useState(
    studentInfo?.organizationUserID
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setIsSubmitting(false);
  };
  const handleChange = (e) => {
    setOrganizationUserID(() => e.target.value);
  };

  const isInstructor = courseInfo?.instructorIDs?.includes(currentUser.uid);
  const organization = courseInfo.organization || "";
  if (!courseInfo?.alert) return null;
  if (isInstructor) return null;
  switch (courseInfo.alert.type) {
    case "request organization ID":
      return (
        <>
          <Tooltip
            title={
              <Typography>
                Your {organization} student ID is needed to accurately assign
                grades at the end of this course - click here to submit.
              </Typography>
            }
          >
            <div
              onClick={handleOpen}
              className="absolute hover-pointer"
              style={{ bottom: "0px", right: "0px" }}
            >
              {studentInfo?.organizationUserID ? (
                <Alert severity="success">
                  Student ID: {studentInfo?.organizationUserID}
                </Alert>
              ) : (
                <Alert severity={courseInfo.alert.severity}>
                  Submit Student ID
                </Alert>
              )}
            </div>
          </Tooltip>
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
              <Box
                className="modal-common-styling"
                style={{
                  padding: "40px",
                  maxHeight: "80vh",
                  width: "380px",
                }}
              >
                <Typography color="primary" variant="h6">
                  Submit Your Student ID
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  style={{ marginBottom: "20px" }}
                >
                  Your {organization} student ID is needed to accurately assign
                  grades at the end of this course. Please enter your student ID
                  into the field below, then click submit. Your information will
                  be kept confidential.
                </Typography>
                <TextField
                  fullWidth
                  label="Student ID"
                  defaultValue={studentInfo?.organizationUserID || null}
                  variant="filled"
                  onChange={handleChange}
                  style={{ marginBottom: "15px" }}
                />

                <Box className="flex justify-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      !organizationUserID ||
                      organizationUserID === studentInfo?.organizationUserID
                    }
                    onClick={() => {
                      setIsSubmitting(true);
                      setOrganizationID(
                        courseInfo,
                        currentUser,
                        organizationUserID,
                        setIsSubmitting,
                        handleClose
                      );
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={25} /> : "Submit"}
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
        </>
      );

    default:
      return null;
  }
}
async function setOrganizationID(
  courseInfo,
  currentUser,
  organizationUserID,
  setIsSubmitting,
  handleClose
) {
  const students = courseInfo?.students;
  const userID = currentUser.uid;
  const studentInfo = students.find((el) => el.id === userID);
  const ref = firebase.firestore().collection("courses").doc(courseInfo.id);
  await ref
    .update({
      students: firebase.firestore.FieldValue.arrayUnion({
        ...studentInfo,
        organizationUserID: organizationUserID,
      }),
    })
    .then(() =>
      ref.update({
        students: firebase.firestore.FieldValue.arrayRemove(studentInfo),
      })
    )
    .then(() => setIsSubmitting(false))
    .then(() => handleClose());
}

function AssignmentTimeSettings({ item }) {
  if (!item.hasOpenDate && !item.hasDueDate) return null;
  if (item.hasOpenDate && !item.hasDueDate)
    return "open " + parseDate(item.open) + " at " + parseTime(item.open);
  if (!item.hasOpenDate && item.hasDueDate)
    return "due " + parseDate(item.due) + " at " + parseTime(item.due);
  if (item.hasOpenDate && item.hasDueDate)
    return (
      <>
        {"open " + parseDate(item.open) + " at " + parseTime(item.open)}
        <br />
        {"due " + parseDate(item.due) + " at " + parseTime(item.due)}
      </>
    );
}

function parseDate(timestamp) {
  const format = {
    day: "numeric",
    month: "short",
  };
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", format);
}

function parseTime(timestamp) {
  const format = {
    hour: "numeric",
    minute: "numeric",
  };
  return new Date(timestamp.seconds * 1000).toLocaleTimeString("en-US", format);
}

function getFileExtension(selectedItem) {
  if (!selectedItem) return null;

  const { itemType } = selectedItem;
  const filenameArr =
    itemType === "document" ? selectedItem?.name.split(".").slice(-1) : null;

  if (!filenameArr) return null;

  const fileExtension = filenameArr[0];
  return fileExtension;
}

function DisplayedItem({
  courseInfo,
  currentUser,
  selectedItem,
  selectedItemIndex,
  selectedModuleIndex,
  selectedQuestionSet,
  selectedStudentUpload,
}) {
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1.6);
  const [currentSkill, setCurrentSkill] = useState(0);
  const [incorrectCounter, setIncorrectCounter] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [inARowCount, setInARowCount] = useState(0);
  const [congratulationsModalOpen, setCongratulationsModalOpen] =
    useState(false);
  const [noRemainingQuestionsModalOpen, setNoRemainingQuestionsModalOpen] =
    useState(false);
  const [helpfulResourceModalOpen, setHelpfulResourceModalOpen] =
    useState(false);

  const handleCongratulationsClose = () => {
    setCongratulationsModalOpen(false);
  };

  const handleNoRemaingQuestionsClose = () => {
    setNoRemainingQuestionsModalOpen(false);
  };

  const handleHelpfulResourceClose = () => {
    setHelpfulResourceModalOpen(false);
  };

  const getActiveStep = async () => {
    const activeStep = await getAssignmentActiveStep(
      courseInfo,
      currentUser,
      selectedItem.assignmentID
    );
    setActiveStep(activeStep);
  };

  const getCurrentSkill = async () => {
    const currentSkill = await getAssignmentCurrentSkill(
      courseInfo,
      currentUser,
      selectedItem.assignmentID
    );
    setCurrentSkill(currentSkill);
  };

  useEffect(() => {
    getActiveStep();
    getCurrentSkill();
    // eslint-disable-next-line
  }, [selectedItem]);

  async function getAssignmentActiveStep(
    courseInfo,
    currentUser,
    assignmentID
  ) {
    const coursesRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseInfo.id)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(currentUser.uid);

    let coursesDoc = await coursesRef.get();

    let activeStep = coursesDoc?.data()?.activeStep
      ? coursesDoc.data().activeStep
      : 0;

    return activeStep;
  }

  async function getAssignmentCurrentSkill(
    courseInfo,
    currentUser,
    assignmentID
  ) {
    const coursesRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseInfo.id)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(currentUser.uid);

    let coursesDoc = await coursesRef.get();

    let currentSkill = coursesDoc?.data()?.currentSkill
      ? coursesDoc.data().currentSkill
      : 0;

    return currentSkill;
  }

  async function clearQuestionSetResponses(
    courseInfo,
    currentUser,
    assignmentID
  ) {
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseInfo.id)
      .collection("grade_summaries")
      .doc(currentUser.uid)
      .update({
        [assignmentID]: firebase.firestore.FieldValue.delete(),
      });

    await firebase
      .firestore()
      .collection("courses")
      .doc(courseInfo.id)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(currentUser.uid)
      .delete();
  }

  function updateModuleAssignment(tidiedValues, selectedItemIndex) {
    const updatedContent = courseInfo.modules[selectedModuleIndex].content.map(
      (item, index) => (index === selectedItemIndex ? tidiedValues : item)
    );
    const updatedModules = courseInfo.modules.map((module, index) => {
      if (index === selectedModuleIndex) {
        module.content = updatedContent;
      }
      return module;
    });
    updateCourseModuleContent(courseInfo.id, updatedModules);
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (!selectedItem)
    return (
      <Typography color="textSecondary">(select an item to display)</Typography>
    );

  const { itemType } = selectedItem;

  const currentTime = new Date().getTime() / 1000; // current date in seconds since Jan 1, 1970 (Javascript convention)
  const hasOpenDate = selectedItem?.hasOpenDate;
  const hasDueDate = selectedItem?.hasDueDate;
  const open = selectedItem?.open?.seconds || null; // assigment open date
  const due = selectedItem?.due?.seconds || null; // assigment due date
  const dueDateExceptions = selectedItem?.dueDateExceptions || null;

  const beforeOpen = hasOpenDate ? currentTime < open : false;
  const pastDue = isAssignmentPastDue(
    hasDueDate,
    due,
    dueDateExceptions,
    currentTime,
    currentUser.uid
  );

  if (beforeOpen)
    return (
      <Typography color="textSecondary">
        The assignment will be open{" "}
        {parseDate(selectedItem.open) + " at " + parseTime(selectedItem.open)}
      </Typography>
    );

  const fileExtension = getFileExtension(selectedItem);

  switch (itemType) {
    case "document":
      if (!fileExtension)
        return (
          <Typography color="textSecondary">error reading document</Typography>
        );
      if (fileExtension === "pdf") return renderPDF();
      if (fileExtension === "nb") return renderMathematicaNotebook();
      break;
    case "link":
      return renderLinkInIframe();
    case "image":
      return (
        <img height="80%" src={selectedItem.url} alt={selectedItem.name} />
      );
    case "question set":
      if (
        !selectedQuestionSet ||
        !selectedQuestionSet?.questions ||
        selectedQuestionSet?.questions?.length === 0
      )
        return null;
      return (
        <>
          <Box>
            {selectedQuestionSet.mode === "adaptive" && (
              <TableContainer
                style={{
                  textAlign: "center",
                }}
              >
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      {selectedQuestionSet?.adaptiveParams?.skills?.map(
                        (skill, index) => (
                          <TableCell align="center">
                            <Typography
                              variant="h6"
                              display="inline"
                              key={index}
                            >
                              {skill.title}
                              <Tooltip
                                placement="top"
                                title={`Must answer ${
                                  skill.completeValue
                                } questions ${
                                  selectedQuestionSet?.adaptiveParams
                                    ?.completeRule === "totalCorrect"
                                    ? `correctly`
                                    : `in a row `
                                } to master skill`}
                              >
                                <InfoIcon
                                  style={{ marginLeft: "2px", color: "grey" }}
                                  fontSize="small"
                                ></InfoIcon>
                              </Tooltip>
                            </Typography>
                            <br />
                            <Typography>
                              (
                              {getSkillCorrectValue(
                                index,
                                skill,
                                selectedQuestionSet?.adaptiveParams?.skills[0]
                              )}{" "}
                              of {skill.completeValue})
                            </Typography>
                          </TableCell>
                        )
                      )}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <MobileStepper
                          steps={getNumberOfSteps()}
                          position="static"
                          variant="progress"
                          activeStep={activeStep}
                          sx={{ width: 400, maxWidth: 400, flexGrow: 1 }}
                        />
                        <br />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Modal
              className="flex-center-all"
              open={noRemainingQuestionsModalOpen}
              onClose={handleNoRemaingQuestionsClose}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={noRemainingQuestionsModalOpen}>
                <Box className="modal-form-v1 modal-common-styling">
                  <Box width={400}>
                    <Typography
                      color="primary"
                      variant="h5"
                      style={{ marginBottom: "15px", marginTop: "0px" }}
                    >
                      No Remaining Questions
                    </Typography>
                    <Typography variant="h6">
                      You've run out of questions for this adaptive assignment.
                      To try again, please click the reset button below.
                    </Typography>
                    <Button
                      display="inline"
                      onClick={() =>
                        clearQuestionSetResponses(
                          courseInfo,
                          currentUser,
                          selectedItem.assignmentID
                        )
                      }
                      color="primary"
                      variant="contained"
                      // disabled={confirmReset !== "reset"}
                    >
                      RESET
                    </Button>
                    {/* {selectedQuestionSet} */}
                  </Box>
                </Box>
              </Fade>
            </Modal>
            <Modal
              className="flex-center-all"
              open={congratulationsModalOpen}
              onClose={handleCongratulationsClose}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={congratulationsModalOpen}>
                <Box className="modal-form-v1 modal-common-styling">
                  <Box width={400}>
                    <Typography
                      color="primary"
                      variant="h5"
                      style={{ marginBottom: "15px", marginTop: "0px" }}
                    >
                      Congratulations
                    </Typography>
                    <Typography variant="h6">
                      You've succesfully mastered the following skills:
                    </Typography>
                    <ul>
                      {selectedQuestionSet?.adaptiveParams?.skills.map(
                        (skill) => (
                          <Typography display="inline">
                            <li>{skill.title}</li>
                          </Typography>
                        )
                      )}
                    </ul>
                  </Box>
                </Box>
              </Fade>
            </Modal>
            <Modal
              className="flex-center-all"
              open={helpfulResourceModalOpen}
              onClose={handleHelpfulResourceClose}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={helpfulResourceModalOpen}>
                <Box className="modal-form-v1 modal-common-styling">
                  <Box width={400}>
                    <Typography
                      color="primary"
                      variant="h5"
                      style={{ marginBottom: "15px", marginTop: "0px" }}
                    >
                      Helpful Resource
                    </Typography>
                    <Typography variant="h6">
                      You seem to be having some difficulty with this
                      assignment. Please click{" "}
                      <Link
                        href={
                          selectedQuestionSet?.adaptiveParams?.skills[
                            currentSkill
                          ]?.resource
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </Link>{" "}
                      to open a pdf resource in a new tab?
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            </Modal>
            <QuestionSetCard
              assignmentID={selectedItem.assignmentID}
              assignmentInfo={selectedItem}
              collection="courses"
              courseID={courseInfo.id}
              courseTitle={courseInfo.title}
              pastDue={pastDue}
              questionSet={selectedQuestionSet}
              userID={currentUser.uid}
              userDisplayName={currentUser.displayName}
              userEmail={currentUser.email}
              updateModuleAssignment={updateModuleAssignment}
              selectedItemIndex={selectedItemIndex}
              setActiveStep={setActiveStep}
              activeStep={activeStep}
              setInARowCount={setInARowCount}
              inARowCount={inARowCount}
              currentSkill={currentSkill}
              setCurrentSkill={setCurrentSkill}
              setCongratulationsModalOpen={setCongratulationsModalOpen}
              setNoRemainingQuestionsModalOpen={
                setNoRemainingQuestionsModalOpen
              }
              setHelpfulResourceModalOpen={setHelpfulResourceModalOpen}
              incorrectCounter={incorrectCounter}
              setIncorrectCounter={setIncorrectCounter}
            />
          </Box>
        </>
      );
    case "student upload":
      return (
        <StudentUpload
          assignmentID={selectedItem.assignmentID}
          courseID={courseInfo.id}
          pastDue={pastDue}
          uploadInfo={selectedStudentUpload}
          userID={currentUser.uid}
        />
      );
    case "studentGradebook":
      return (
        <StudentGradebook
          courseID={courseInfo.id}
          modules={courseInfo.modules}
          currentUser={currentUser}
          currentSkill={currentSkill}
          setCurrentSkill={setCurrentSkill}
        ></StudentGradebook>
      );
    default:
      return (
        <Typography color="textSecondary">
          an error occurred - please contact your instructor
        </Typography>
      );
  }

  function isAssignmentPastDue(
    hasDueDate,
    due,
    dueDateExceptions,
    currentTime,
    userID
  ) {
    const userDueDate =
      dueDateExceptions
        ?.find((exception) => exception.userID === userID)
        ?.dueDate.toDate()
        .getTime() / 1000;
    if (userDueDate > currentTime) {
      return false;
    }

    return hasDueDate ? currentTime > due : false;
  }

  function getSkillCorrectValue(index, skill, firstSkill) {
    let skillCorrectValue = 0;

    switch (index) {
      case 0:
        skillCorrectValue =
          currentSkill === 0 ? activeStep : skill.completeValue;
        break;
      case 1:
        skillCorrectValue =
          currentSkill === 1 ? activeStep - firstSkill.completeValue : 0;
        break;

      default:
        break;
    }

    return skillCorrectValue;
  }

  function getNumberOfSteps() {
    return (
      selectedQuestionSet?.adaptiveParams?.skills.reduce((acc, curr) => {
        return acc + curr.completeValue;
      }, 0) + 1
    );
  }

  function renderLinkInIframe() {
    return (
      <iframe
        title="Embedded Link Media"
        width="90%"
        height="90%"
        src={selectedItem.url}
        frameBorder="0"
        allow="accelerometer; gyroscope; fullscreen; clipboard-write; clipboard-read; encrypted-media;"
      ></iframe>
    );
  }

  function renderMathematicaNotebook() {
    return (
      <Box className="flex column justify-center">
        <Typography color="textSecondary" variant="subtitle1">
          Mathematica file (click link to download)
        </Typography>

        <Typography variant="h6">
          <Link
            href={getPublicUrl(selectedItem.url)}
            rel="noreferrer"
            target="_blank"
          >
            {selectedItem.name}
          </Link>
        </Typography>
        <Box maxWidth="500px">
          <Typography
            variant="caption"
            style={{ wordWrap: "break-word" }}
            color="textSecondary"
          >
            {getPublicUrl(selectedItem.url)}
          </Typography>
        </Box>
      </Box>
    );
  }

  function renderPDF() {
    return (
      <Box
        maxHeight="80vh"
        className="relative overflow-auto flex justify-center"
        style={{ bottom: "3vh" }}
      >
        <Document
          file={selectedItem.url}
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
        <ZoomControl zoom={zoom} setZoom={setZoom} url={selectedItem.url} />
      </Box>
    );
  }
}

function fetchCourseInfo(courseID, setCourseInfo) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.onSnapshot((doc) =>
    setCourseInfo({
      id: doc.id,
      title: doc.data().title,
      instructorIDs: doc.data().instructorIDs,
      students: doc.data().students,
      modules: doc.data().modules,
      organization: doc.data().organization,
      alert: doc.data().alert,
    })
  );
}

async function fetchStudentUpload(
  courseID,
  assignmentID,
  setSelectedStudentUpload
) {
  const assignmentRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID);

  const fetchedItem = await assignmentRef.get();
  setSelectedStudentUpload({
    id: fetchedItem.id,
    title: fetchedItem.data().title,
    instructions: fetchedItem.data().instructions,
    accept: fetchedItem.data().accept,
    totalPossiblePoints: fetchedItem.data().totalPossiblePoints,
  });
}

async function fetchQuestionSet(docRef, setSelectedQuestionSet) {
  const fetchedItem = await firebase.firestore().doc(docRef).get();
  setSelectedQuestionSet({
    id: fetchedItem.id,
    title: fetchedItem.data()?.title,
    mode: fetchedItem.data()?.mode,
    questions: fetchedItem.data()?.questions,
    totalPossiblePoints: fetchedItem.data()?.totalPossiblePoints,
    adaptiveParams: fetchedItem.data()?.adaptiveParams,
  });
}

export function getPublicUrl(url) {
  const urlArr = url.split("?");
  const baseUrl = urlArr[0];
  const trimmedUrl = baseUrl
    .slice(16)
    .replaceAll("%2F", "/")
    .replace("/o", "")
    .replace("v0/b/", "");
  const publicUrl = "https://" + trimmedUrl;

  return publicUrl;
}
