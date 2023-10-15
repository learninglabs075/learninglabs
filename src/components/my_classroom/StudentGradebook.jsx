import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Card,
  CardContent,
  Divider,
  Fade,
  Link,
  Modal,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Typography,
} from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import { Warning, Info } from "@material-ui/icons";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { displayEarnedOfPossible, ZoomControl } from "../../app/utils/utils.js";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";
import { headerStyle, rowStyle } from "../../app/utils/stylingSnippets.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function StudentGradebook({
  courseID,
  modules,
  currentUser,
  currentSkill,
  setCurrentSkill,
}) {
  const allCourseContent = modules.map((module) => module.content).flat();
  const courseAssignments = allCourseContent.filter(
    (content) => content.contentType === "assignment"
  );

  const [selectedUploads, setSelectedUploads] = useState([]);
  const [gradeSummaries, setGradeSummaries] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState({});
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [qSetPreviewOpen, setQSetPreviewOpen] = useState(false);
  const [studentUploadPrevOpen, setStudentUploadPrevOpen] = useState(false);
  const [assignmentGrade, setAssignmentGrade] = useState(null);

  const closeQSetPreview = () => {
    setQSetPreviewOpen(false);
    fetchGradeSummaries(courseID, currentUser);
  };

  const closeStudentUploadPreview = () => {
    setStudentUploadPrevOpen(false);
  };

  useEffect(
    () => fetchGradeSummaries(),
    //eslint-disable-next-line
    []
  );

  function openStudentAssignment(assignment, studentID) {
    switch (assignment.itemType) {
      case "question set":
        fetchQuestionSet(assignment.docRef, setSelectedQuestionSet);
        break;
      case "student upload":
        fetchStudentUpload(assignment.assignmentID, studentID);
        break;
      default:
        break;
    }
  }

  async function fetchQuestionSet(docRef, setSelectedQuestionSet) {
    await firebase
      .firestore()
      .doc(docRef)
      .get()
      .then((doc) => setSelectedQuestionSet({ id: doc.id, ...doc.data() }))
      .then(() => setQSetPreviewOpen(true));
  }

  async function fetchStudentUpload(assignmentID, studentID) {
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .collection("uploads")
      .doc(studentID)
      .get()
      .then((doc) => setSelectedUploads(doc.data().files))
      .then(() => setStudentUploadPrevOpen(true));
  }

  async function fetchGradeSummaries() {
    const fetchedItems = [];
    let studentGradeSummary = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(currentUser.uid)
      .get();

    if (studentGradeSummary.exists) {
      fetchedItems.push({
        userID: studentGradeSummary.id,
        ...studentGradeSummary.data(),
      });
      setGradeSummaries(fetchedItems);
    }
  }

  function displayPointSummary(assignment, summary, studentID) {
    const assignmentGrade = summary[assignment.assignmentID];

    if (!assignmentGrade)
      return <Typography color="textSecondary">N/A</Typography>;
    else
      return (
        <Link
          className="hover-pointer"
          style={{ fontFamily: "Lato" }}
          onClick={() => {
            setSelectedUserID(studentID);
            setSelectedAssignment(assignment);
            setAssignmentGrade(assignmentGrade);
            openStudentAssignment(assignment, studentID);
          }}
        >
          {assignmentGrade.mode === "adaptive" &&
            displayAdaptiveSkillCompletionStatus(assignmentGrade)}
          {assignmentGrade.mode !== "adaptive" &&
            displayEarnedOfPossible(assignmentGrade)}
          {assignmentGrade?.pointAdjustment ||
          assignmentGrade?.pointAdjustmentForSpecificQuestions ? (
            <Tooltip title="Points have been adjusted by instructor.">
              <Info style={{ marginLeft: "2px" }} fontSize="small"></Info>
            </Tooltip>
          ) : null}
          {assignmentGrade?.pendingFreeResponseReview?.length > 0 ? (
            <Tooltip title="Free Response Questions Pending Review">
              <Info fontSize="small" style={{ marginLeft: "2px" }}></Info>
            </Tooltip>
          ) : null}{" "}
          {assignmentGrade?.dueDateExceededPenaltyPercentage ? (
            <Tooltip title="A late penalty has been applied to this assignment score">
              <Warning
                style={{ marginLeft: "2px", color: "#FF9970" }}
                fontSize="small"
              ></Warning>
            </Tooltip>
          ) : null}{" "}
        </Link>
      );

    function displayAdaptiveSkillCompletionStatus(assignmentGrade) {
      return assignmentGrade?.completedSkills?.length > 0
        ? assignmentGrade?.completedSkills?.map((skill) => {
            return (
              <span key={skill.name}>
                <Tooltip title={`Successfully completed  ${skill.name}`}>
                  <CheckCircleOutlineIcon
                    color="primary"
                    style={{ marginRight: 5 }}
                  />
                </Tooltip>
              </span>
            );
          })
        : `In Progress`;
    }
  }

  return (
    <>
      <TableContainer
        style={{
          marginLeft: "10px",
          marginRight: "10px",
          marginTop: "75px",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={headerStyle}>Student Name</TableCell>
              {courseAssignments.map((assignment, index) => (
                <TableCell style={headerStyle} key={`assigment${index}`}>
                  {assignment.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeSummaries?.map((summary, userIndex) => (
              <TableRow key={`userDisplayName${userIndex}`}>
                <TableCell style={rowStyle}>
                  {summary.userDisplayName}
                </TableCell>
                {courseAssignments?.map((assignment, assignmentIndex) => (
                  <TableCell
                    key={`assignment${assignmentIndex}`}
                    style={rowStyle}
                  >
                    {displayPointSummary(assignment, summary, summary.userID)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StudentUploadPreview
        assignmentGrade={assignmentGrade}
        closeModal={closeStudentUploadPreview}
        courseID={courseID}
        gradeSummaries={gradeSummaries}
        previewOpen={studentUploadPrevOpen}
        selectedAssignment={selectedAssignment}
        selectedUploads={selectedUploads}
        selectedUserID={selectedUserID}
        setGradeSummaries={setGradeSummaries}
      />
      <QuestionSetModal
        assignmentGrade={assignmentGrade}
        closeModal={closeQSetPreview}
        courseID={courseID}
        gradeSummaries={gradeSummaries}
        previewOpen={qSetPreviewOpen}
        selectedAssignment={selectedAssignment}
        selectedQuestionSet={selectedQuestionSet}
        selectedUserID={selectedUserID}
        setAssignmentGrade={setAssignmentGrade}
        setGradeSummaries={setGradeSummaries}
        currentSkill={currentSkill}
        setCurrentSkill={setCurrentSkill}
      />
    </>
  );
}

function StudentUploadPreview({
  assignmentGrade,
  closeModal,
  courseID,
  gradeSummaries,
  previewOpen,
  selectedAssignment,
  selectedUploads,
  selectedUserID,
  setGradeSummaries,
}) {
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  // const [points, setPoints] = useState(totalEarnedPoints);
  const [imageURL, setImageURL] = useState("");
  const [documentURL, setDocumentURL] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => setImageURL(""), [selectedAssignment]);
  useEffect(() => setDocumentURL(""), [selectedAssignment]);

  const options = {
    cMapUrl: "cmaps/",
    cMapPacked: true,
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function displaySelectedMedia(uploadInfo) {
    setDocumentURL("");
    setImageURL("");

    switch (uploadInfo.type) {
      case "image/png":
        setImageURL(uploadInfo.url);
        break;
      case "image/jpeg":
        setImageURL(uploadInfo.url);
        break;
      case "application/pdf":
        setDocumentURL(uploadInfo.url);
        break;
      default:
        break;
    }
  }

  return (
    <Modal
      className="flex-center-all"
      open={previewOpen}
      onClose={closeModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={previewOpen}>
        <Box className="modal-form-v2 modal-common-styling flex-row">
          <Box
            minWidth="220px"
            minHeight="500px"
            className="flex-column padding-light"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <Typography variant="h6" color="textSecondary">
              {selectedAssignment.title}
            </Typography>
            <Divider />

            <Typography
              variant="subtitle1"
              className="padding-left-light"
              style={{ marginTop: "20px" }}
            >
              Submitted Files
            </Typography>
            {selectedUploads.map((uploadInfo, index) => (
              <Link
                noWrap
                key={`upload${index}`}
                className="hover-pointer padding-left-light"
                style={{ fontFamily: "Lato" }}
                onClick={() => displaySelectedMedia(uploadInfo)}
              >
                {uploadInfo.name}
              </Link>
            ))}
            <Box
              className="flex align-center justify-end"
              style={{ marginTop: "50px", marginBottom: "15px" }}
            >
              <Typography
                style={{ marginLeft: "6px", marginRight: "5px" }}
                display="inline"
              >
                {totalEarnedPoints} / {totalPossiblePoints}
              </Typography>
              <Typography
                display="inline"
                variant="subtitle1"
                style={{ marginRight: "20px" }}
              >
                points
              </Typography>
            </Box>
          </Box>
          <Box className="margin-left-medium flex-center-all" minWidth="780px">
            {!documentURL && !imageURL && (
              <Typography color="textSecondary">
                please select a file to view
              </Typography>
            )}
            {documentURL && (
              <Box
                maxWidth="120vw"
                maxHeight="100%"
                className="overflow-auto flex justify-center"
              >
                <Document
                  file={documentURL}
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
            {imageURL && <img src={imageURL} width="80%" alt="" />}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

function QuestionSetModal({
  assignmentGrade,
  closeModal,
  courseID,
  previewOpen,
  selectedAssignment,
  selectedQuestionSet,
  selectedUserID,
  setAssignmentGrade,
  currentSkill,
  setCurrentSkill,
}) {
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  const pointAdjustment = assignmentGrade?.pointAdjustment
    ? assignmentGrade.pointAdjustment
    : 0;

  const totalPoints = totalEarnedPoints + pointAdjustment;

  if (!selectedQuestionSet) return null;

  return (
    <Modal
      className="flex-center-all"
      open={previewOpen}
      onClose={closeModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={previewOpen}>
        <Box className="modal-form-v2 modal-common-styling flex-column">
          <Card
            style={{
              minWidth: "300px",
              minHeight: "150px",
            }}
          >
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                {selectedQuestionSet.title}
              </Typography>
              <Divider />
              <Typography style={{ marginBottom: "5px" }}>
                {pointAdjustment
                  ? totalEarnedPoints + pointAdjustment
                  : totalEarnedPoints}{" "}
                of {totalPossiblePoints} points
                {pointAdjustment ? <span>***</span> : null}
              </Typography>

              {totalPoints > totalEarnedPoints && (
                <Typography variant="subtitle2" color="primary">
                  {totalEarnedPoints} pt score +{" "}
                  {totalPoints - totalEarnedPoints} pt adjustment
                </Typography>
              )}
              {totalPoints < totalEarnedPoints && (
                <Typography
                  variant="subtitle2"
                  style={{ color: "rgb(170,103,87)" }}
                >
                  {totalEarnedPoints} pt score −{" "}
                  {Math.abs(totalPoints - totalEarnedPoints)} pt adjustment
                </Typography>
              )}

              {assignmentGrade?.dueDateExceededPenaltyPercentage && (
                <Typography variant="subtitle2" style={{ color: "#FF9970" }}>
                  {assignmentGrade?.dueDateExceededPenaltyPercentage}% late
                  penalty gives a new score of{" "}
                  <span
                    style={{
                      textDecoration: "underline",
                      fontWeight: "bold",
                    }}
                  >
                    {assignmentGrade?.totalEarnedPoints *
                      (1 -
                        assignmentGrade?.dueDateExceededPenaltyPercentage /
                          100)}{" "}
                    pts{" "}
                  </span>
                </Typography>
              )}
            </CardContent>
          </Card>
          <hr />
          <QuestionSetCard
            assignmentGrade={assignmentGrade}
            assignmentID={selectedAssignment.assignmentID}
            collection="courses"
            courseID={courseID}
            instructorView={false}
            questionSet={selectedQuestionSet}
            studentGradebook={true}
            setAssignmentGrade={setAssignmentGrade}
            userID={selectedUserID}
            currentSkill={currentSkill}
            setCurrentSkill={setCurrentSkill}
          />
        </Box>
      </Fade>
    </Modal>
  );
}
