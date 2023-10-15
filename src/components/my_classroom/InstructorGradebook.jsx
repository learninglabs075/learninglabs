import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
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
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  ArrowDownward,
  ArrowUpward,
  GetApp,
  NotificationsActive,
  Refresh,
  Warning,
} from "@material-ui/icons";
import { CSVDownloader } from "react-papaparse";
import firebase from "../../app/config/firebaseConfig.js";
import { displayEarnedOfPossible, ZoomControl } from "../../app/utils/utils.js";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";
import {
  headerStyle,
  headerStyle2,
  rowStyle,
  rowStyle2,
} from "../../app/utils/stylingSnippets.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import InfoIcon from "@material-ui/icons/Info";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { pdfjs } from "react-pdf";
import spinner from "../../assets/Spinner.gif";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function InstructorGradebook({
  courseID,
  modules,
  instructors,
}) {
  const allCourseContent = modules.map((module) => module.content).flat();
  const courseAssignments = allCourseContent.filter(
    (content) => content.contentType === "assignment"
  );
  const [selectedUploads, setSelectedUploads] = useState([]);
  const [gradeSummaries, setGradeSummaries] = useState([]);
  const [excludedGradeSummaries, setExcludedGradeSummaries] = useState([]);
  const [gradebook, setGradebook] = useState([{ Gradebook: "Loading..." }]);
  const [assignmentDetailedResponses, setAssignmentDetailedResponses] =
    useState([{ Assignment: "Loading..." }]);
  const [
    assignmentDetailedResponsesCSVLoading,
    setAssignmentDetailedResponsesCSVLoading,
  ] = useState(false);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState({});
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [qSetPreviewOpen, setQSetPreviewOpen] = useState(false);
  const [studentUploadPrevOpen, setStudentUploadPrevOpen] = useState(false);
  const [assignmentGrade, setAssignmentGrade] = useState(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [currentSkill, setCurrentSkill] = useState(0);
  const [includeTimeSpent, setIncludeTimeSpent] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const closeQSetPreview = () => {
    setQSetPreviewOpen(false);
    fetchGradeSummaries();
  };

  const closeStudentUploadPreview = () => {
    setStudentUploadPrevOpen(false);
  };

  useEffect(
    () => fetchGradeSummaries(),
    //eslint-disable-next-line
    []
  );

  useEffect(
    () => {
      if (includeTimeSpent) {
        setLoadingCSV(true);
      }
      getGradebook(courseAssignments, gradeSummaries).then((data) => {
        setGradebook(data);
        setLoadingCSV(false);
      });
    },
    //eslint-disable-next-line
    [gradeSummaries, includeTimeSpent]
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
    let doc = await firebase.firestore().doc(docRef).get();

    setSelectedQuestionSet({ id: doc.id, ...doc.data() });
    setQSetPreviewOpen(true);
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

  async function getTimeSpentOnAssignment(assignmentID, userID) {
    let timeSpent = 0;
    let userAssignmentResult = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(userID)
      .get();

    if (userAssignmentResult.exists) {
      let timestamps = Object.keys(userAssignmentResult.data()).filter((key) =>
        key.endsWith("_timestamps")
      );
      let timeSpentOnAssignment = timestamps.map((timestamp) => {
        let times = userAssignmentResult.data()[timestamp];
        return times;
      });

      let firstAssignmentDateTime = timeSpentOnAssignment[0][0].toDate();
      let lastAssignmentDateTime = timeSpentOnAssignment[0][0].toDate();

      timeSpentOnAssignment.forEach((timestamp) => {
        if (timestamp[0].toDate() < firstAssignmentDateTime) {
          firstAssignmentDateTime = timestamp[0].toDate();
        }
        if (timestamp[0].toDate() > lastAssignmentDateTime) {
          lastAssignmentDateTime = timestamp[0].toDate();
        }
      });

      timeSpent = Math.abs(
        lastAssignmentDateTime.getTime() - firstAssignmentDateTime.getTime()
      );

      timeSpentOnAssignment =
        extractDaysHoursMinutesSecondsSpentOnAssignment(timeSpent);

      return timeSpentOnAssignment;
    }

    return "N/A";
  }

  function extractDaysHoursMinutesSecondsSpentOnAssignment(timeSpent) {
    let timeSpentOnAssignment = "";

    let days = Math.floor(timeSpent / (1000 * 60 * 60 * 24));
    timeSpent = timeSpent % (1000 * 60 * 60 * 24); //Decrements timeSpent by the number of days in milliseconds

    let hours = Math.floor(timeSpent / (1000 * 60 * 60));
    timeSpent = timeSpent % (1000 * 60 * 60); //Decrements timeSpent by the number of hours in milliseconds

    let minutes = Math.floor(timeSpent / (1000 * 60));
    timeSpent = timeSpent % (1000 * 60); //Decrements timeSpent by the number of minutes in milliseconds

    let seconds = Math.floor(timeSpent / 1000);

    if (days > 0) {
      timeSpentOnAssignment += days + "d ";
    }
    if (hours > 0) {
      timeSpentOnAssignment += hours + "h ";
    }
    if (minutes > 0) {
      timeSpentOnAssignment += minutes + "m ";
    }
    if (seconds > 0) {
      timeSpentOnAssignment += seconds + "s ";
    }

    return timeSpentOnAssignment;
  }

  async function fetchGradeSummaries(order = "asc") {
    const fetchedItems = [];
    const instructorFetchedItems = [];
    const instructorIDs = instructors.map((instructor) => instructor.id);

    let ref = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .orderBy("userLastName", order)
      .orderBy("userFirstName", order)
      .get();

    ref.forEach((doc) => {
      !instructorIDs?.includes(doc.data().userID) &&
        fetchedItems.push({ userID: doc.id, ...doc.data() });
    });

    ref.forEach((doc) => {
      instructorIDs?.includes(doc.data().userID) &&
        instructorFetchedItems.push({ userID: doc.id, ...doc.data() });
    });

    setGradeSummaries(fetchedItems);
    setExcludedGradeSummaries(instructorFetchedItems);
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
            <Tooltip title="Points have been adjusted by instructor">
              <InfoIcon
                color="primary"
                style={{ marginLeft: "2px" }}
                fontSize="small"
              ></InfoIcon>
            </Tooltip>
          ) : null}{" "}
          {assignmentGrade?.pendingFreeResponseReview?.length > 0 ? (
            <Tooltip title="Free Response Questions Pending Review">
              <NotificationsActive
                style={{ marginLeft: "2px", color: "#FF9970" }}
                fontSize="small"
              ></NotificationsActive>
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

  async function getUserAssignmentSubmissionHistory(assignmentID, userID) {
    let detailedAssignmentResponses = [];
    let userAssignmentResult = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(userID)
      .get();

    let userAssignmentResultData = userAssignmentResult.data();

    if (userAssignmentResultData) {
      Object.keys(userAssignmentResultData).forEach((key) => {
        if (key.endsWith("_responses")) {
          let questionID = key.replace("_responses", "");
          let responses = userAssignmentResultData[key];
          let answeredCorrectly =
            userAssignmentResultData[
              key.replace("_responses", "") + "_answeredCorrectly"
            ];
          let lastResponse = responses[responses.length - 1];
          let lastResponseLetter = String.fromCharCode(
            65 + parseInt(lastResponse)
          );

          detailedAssignmentResponses.push({
            questionID,
            lastResponseLetter,
            answeredCorrectly,
          });
        }
      });
    }

    detailedAssignmentResponses.sort((a, b) => {
      return a.questionID.localeCompare(b.questionID, undefined, {
        numeric: true,
      });
    });

    return detailedAssignmentResponses;
  }

  async function getGradebook(courseAssignments, gradeSummaries) {
    let gradeBook = gradeSummaries.map((i) => {
      return {};
    });

    for (let i = 0; i < gradeSummaries.length; i++) {
      const studentGradeSummary = getStudentNameEmailID(
        gradeSummaries,
        i,
        gradeBook
      );
      await throttleLargeQueries(i);
      for (let k = 0; k < courseAssignments.length; k++) {
        const title = courseAssignments[k].title;

        if (
          studentGradeSummary.hasOwnProperty(courseAssignments[k].assignmentID)
        ) {
          getAssignmentScore(
            gradeBook,
            i,
            title,
            studentGradeSummary,
            courseAssignments,
            k
          );

          if (includeTimeSpent) {
            gradeBook[i][title + " - Time Spent"] = getTimeSpentOnAssignment(
              courseAssignments[k].assignmentID,
              studentGradeSummary.userID
            );
          }

          continue;
        }

        gradeBook[i][title] = "0";
      }
    }

    if (includeTimeSpent) {
      await getTimeSpentOnAssignmentPromisesResolved(gradeBook);
    }

    gradeBook = generateTotalPossiblePointsRow(courseAssignments, gradeBook);

    return gradeBook;
  }

  async function throttleLargeQueries(i) {
    if (includeTimeSpent && i % 100 === 0 && i !== 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async function getAssignmentDetailedGradebook(
    courseAssignments,
    gradeSummaries
  ) {
    const gradeBook = createEmptyGradebook(gradeSummaries);

    for (let i = 0; i < gradeSummaries.length; i++) {
      const studentGradeSummary = getStudentNameEmailID(
        gradeSummaries,
        i,
        gradeBook
      );
      const studentAssignments = getStudentAssignments(
        studentGradeSummary,
        courseAssignments
      );

      await addDetailedAssignmentResponsesToGradebook(
        studentAssignments,
        gradeBook,
        i,
        studentGradeSummary
      );
    }

    return gradeBook;
  }

  function createEmptyGradebook(gradeSummaries) {
    return gradeSummaries.map(() => ({}));
  }

  function getStudentAssignments(studentGradeSummary, courseAssignments) {
    return courseAssignments.filter((assignment) =>
      studentHasAssignment(studentGradeSummary, assignment.assignmentID)
    );
  }

  function studentHasAssignment(studentGradeSummary, assignmentID) {
    return studentGradeSummary.hasOwnProperty(assignmentID);
  }

  function isAssessmentAssignment(assignment) {
    return /Assessment/i.test(assignment.title);
  }

  async function addDetailedAssignmentResponsesToGradebook(
    studentAssignments,
    gradeBook,
    studentIndex,
    studentGradeSummary
  ) {
    const targetAssignments = studentAssignments.filter((assignment) =>
      isAssessmentAssignment(assignment)
    );

    if (targetAssignments.length === 0) {
      return;
    }

    const detailedAssignmentResponses =
      await getUserAssignmentSubmissionHistory(
        targetAssignments[0].assignmentID,
        studentGradeSummary.userID
      );

    detailedAssignmentResponses.forEach((response) => {
      const questionID = response.questionID;
      const lastResponseLetter = response.lastResponseLetter;
      const answeredCorrectly = response.answeredCorrectly;

      gradeBook[studentIndex][questionID] = lastResponseLetter;
      gradeBook[studentIndex][questionID + " - Correct"] = answeredCorrectly;
    });
  }

  function Spinner(props) {
    return (
      <span>
        <Tooltip
          title={
            props.regularCSV
              ? "Building CSV with time spent, once complete, please click the download csv button once again."
              : "Building CSV, your download will happen automatically upon completion."
          }
          placement="top"
        >
          <img
            src={spinner}
            style={{ width: "25px", verticalAlign: "sub" }}
            alt="Loading..."
          />
        </Tooltip>
      </span>
    );
  }

  return (
    <>
      <Box className="flex space-between margin-bottom-light">
        <Button
          style={{ color: "rgba(0, 0, 0, 0.54)" }}
          onClick={() => fetchGradeSummaries()}
          startIcon={<Refresh />}
        >
          Refresh
        </Button>
        <Box>
          {assignmentDetailedResponsesCSVLoading && <Spinner />}
          {!assignmentDetailedResponsesCSVLoading && (
            <CSVDownloader
              data={assignmentDetailedResponses || [{ assignment: "Loading" }]}
              filename={"Assignment Responses"}
              bom={true}
              disabled={true}
            >
              <span id="assignmentDetailedResponsesCSVDownload"></span>
              <Button
                component="label"
                style={{ color: "rgba(0, 0, 0, 0.54)" }}
                startIcon={<GetApp />}
                onClick={async (e) => {
                  await processDetailedAssessmentCSVButtonClicked(e);
                }}
              >
                Download Detailed Assessment (.csv)
              </Button>
            </CSVDownloader>
          )}
          {loadingCSV && <Spinner regularCSV={true} />}
          {!loadingCSV && (
            <CSVDownloader
              data={gradebook}
              filename={"Course Grades"}
              bom={true}
              disabled={true}
            >
              <Button
                component="label"
                style={{ color: "rgba(0, 0, 0, 0.54)" }}
                startIcon={<GetApp />}
              >
                Download Gradebook (.csv)
              </Button>
            </CSVDownloader>
          )}
          <Checkbox
            checked={includeTimeSpent}
            onChange={(e) => {
              setIncludeTimeSpent(!includeTimeSpent);
            }}
          />
          <Tooltip
            title="Include Time Spent on each assignment"
            placement="top"
          >
            <InfoIcon style={{ color: "grey" }}></InfoIcon>
          </Tooltip>
        </Box>
      </Box>
      <TableContainer style={{ maxHeight: "500px" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={headerStyle}>
                Student Name{" "}
                {sortAscending ? (
                  <ArrowUpward
                    style={{ height: "15px", width: "15px", cursor: "pointer" }}
                    onClick={() => {
                      fetchGradeSummaries("desc");
                      setSortAscending(false);
                    }}
                  />
                ) : (
                  <ArrowDownward
                    style={{ height: "15px", width: "15px", cursor: "pointer" }}
                    onClick={() => {
                      fetchGradeSummaries("asc");
                      setSortAscending(true);
                    }}
                  />
                )}
              </TableCell>
              {courseAssignments.map((assignment, index) => (
                <TableCell style={headerStyle2} key={`assigment${index}`}>
                  {assignment.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeSummaries?.map((summary, userIndex) => (
              <TableRow key={`userDisplayName${userIndex}`}>
                <TableCell style={rowStyle}>
                  {summary.userLastName + ", " + summary.userFirstName}
                </TableCell>
                {courseAssignments?.map((assignment, assignmentIndex) => (
                  <TableCell
                    key={`assignment${assignmentIndex}`}
                    style={rowStyle2}
                  >
                    {displayPointSummary(assignment, summary, summary.userID)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {gradeSummaries?.length > 4 && (
        <Typography
          className="student-count"
          color="textPrimary"
          style={{ marginTop: "5px" }}
        >
          # of students: {gradeSummaries?.length}
        </Typography>
      )}

      {excludedGradeSummaries?.length > 0 && (
        <>
          <br />
          <Typography variant="h6">
            Teaching Assistants / Instructors / Other
            <Button
              style={{ color: "rgba(0, 0, 0, 0.54)", marginLeft: "15px" }}
              onClick={() => fetchGradeSummaries()}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Typography>
          <TableContainer style={{ marginTop: "25px" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={headerStyle}>Student Name </TableCell>
                  {courseAssignments.map((assignment, index) => (
                    <TableCell style={headerStyle2} key={`assigment${index}`}>
                      {assignment.title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {excludedGradeSummaries?.map((summary, userIndex) => (
                  <TableRow key={`userDisplayName${userIndex}`}>
                    <TableCell style={rowStyle}>
                      {summary.userLastName + ", " + summary.userFirstName}
                    </TableCell>
                    {courseAssignments?.map((assignment, assignmentIndex) => (
                      <TableCell
                        key={`assignment${assignmentIndex}`}
                        style={rowStyle2}
                      >
                        {displayPointSummary(
                          assignment,
                          summary,
                          summary.userID
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

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
        gradeSummaries={gradeSummaries.concat(excludedGradeSummaries)}
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

  async function processDetailedAssessmentCSVButtonClicked(e) {
    e.stopPropagation();
    setAssignmentDetailedResponsesCSVLoading(true);
    await getAssignmentDetailedGradebook(
      courseAssignments,
      gradeSummaries
    ).then((data) => {
      setAssignmentDetailedResponses(data);
    });
    setAssignmentDetailedResponsesCSVLoading(false);
    document.getElementById("assignmentDetailedResponsesCSVDownload").click();
  }

  async function getTimeSpentOnAssignmentPromisesResolved(gradeBook) {
    for (let k = 0; k < gradeBook.length; k++) {
      for (let key in gradeBook[k]) {
        if (
          key.includes("Time Spent") &&
          gradeBook[k][key] instanceof Promise
        ) {
          gradeBook[k][key] = await gradeBook[k][key];
        }
      }
    }
  }

  function getStudentNameEmailID(gradeSummaries, i, gradeBook) {
    const studentGradeSummary = gradeSummaries[i];
    gradeBook[i]["Last Name"] =
      studentGradeSummary.userLastName || "(not entered)";
    gradeBook[i]["First Name"] =
      studentGradeSummary.userFirstName || "(not entered)";
    gradeBook[i]["Email"] = studentGradeSummary.userEmail || "(not entered)";
    gradeBook[i]["Student ID"] =
      studentGradeSummary.organizationUserID || "(not entered)";
    return studentGradeSummary;
  }

  function generateTotalPossiblePointsRow(courseAssignments, gradeBook) {
    const assignmentTotalPossiblePoints = {
      "Student Name": "Total Possible Points",
    };
    courseAssignments.forEach(async (assignment) => {
      if (assignment.docRef) {
        let questionSet = await firebase
          .firestore()
          .doc(assignment.docRef)
          .get();

        if (questionSet.exists && questionSet.data()?.mode !== "adaptive") {
          assignmentTotalPossiblePoints[assignment.title] =
            questionSet.data()?.totalPossiblePoints;
        }

        if (questionSet.exists && questionSet.data()?.mode === "adaptive") {
          assignmentTotalPossiblePoints[assignment.title] = questionSet
            .data()
            ?.adaptiveParams?.skills.map((skill) => {
              return skill.title;
            })
            .join(", ");
        }
      }
    });

    gradeBook.push({});
    gradeBook.push(assignmentTotalPossiblePoints);
    return gradeBook;
  }
}

function getAssignmentScore(
  gbook,
  i,
  title,
  studentGradeSummary,
  courseAssignments,
  k
) {
  gbook[i][title] =
    studentGradeSummary[courseAssignments[k].assignmentID]?.mode !== "adaptive"
      ? studentGradeSummary[courseAssignments[k].assignmentID].totalEarnedPoints
      : generateStudentsCompletedSkills();

  function generateStudentsCompletedSkills() {
    return studentGradeSummary[courseAssignments[k].assignmentID]?.mode ===
      "adaptive"
      ? studentGradeSummary[courseAssignments[k].assignmentID]?.completedSkills
          ?.map((skill) => {
            return skill.name;
          })
          ?.join(", ")
      : "";
  }
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
  const [points, setPoints] = useState(totalEarnedPoints);
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

  const handlePointsChange = (event) => {
    setPoints(Number(event.target.value));
  };

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
            {selectedUploads.map((uploadInfo, index) =>
              uploadInfo.type === "image/png" ||
              uploadInfo.type === "image/jpeg" ||
              uploadInfo.type === "application/pdf" ? (
                <Link
                  className="hover-pointer padding-left-light"
                  key={`upload${index}`}
                  noWrap
                  onClick={() => displaySelectedMedia(uploadInfo)}
                  style={{ fontFamily: "Lato" }}
                >
                  {uploadInfo.name}
                </Link>
              ) : (
                <Link
                  className="hover-pointer padding-left-light"
                  href={uploadInfo.url}
                  download
                  key={`upload${index}`}
                  noWrap
                  style={{ fontFamily: "Lato" }}
                >
                  {uploadInfo.name}
                </Link>
              )
            )}
            <Box
              className="flex align-center justify-end"
              style={{ marginTop: "50px", marginBottom: "15px" }}
            >
              <TextField
                inputProps={{
                  min: 0,
                  style: { width: "50px", padding: 5, textAlign: "center" },
                }}
                type="number"
                variant="outlined"
                defaultValue={totalEarnedPoints}
                onChange={handlePointsChange}
              />
              <Typography
                style={{ marginLeft: "6px", marginRight: "5px" }}
                display="inline"
              >
                / {totalPossiblePoints}
              </Typography>
              <Typography
                display="inline"
                variant="subtitle1"
                style={{ marginRight: "20px" }}
              >
                points
              </Typography>
            </Box>

            <Button
              type="button"
              variant="contained"
              color="primary"
              style={{
                width: "140px",
                alignSelf: "flex-end",
                marginRight: "16px",
              }}
              onClick={() => {
                updateStudentUploadGrade(
                  courseID,
                  selectedAssignment.assignmentID,
                  selectedUserID,
                  points,
                  gradeSummaries,
                  setGradeSummaries
                );
              }}
              disabled={totalEarnedPoints === points}
            >
              Update
            </Button>
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
            {imageURL && (
              <img
                src={imageURL}
                style={{ maxWidth: "80%", maxHeight: "80vh" }}
                alt=""
              />
            )}
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
  gradeSummaries,
  previewOpen,
  selectedAssignment,
  selectedQuestionSet,
  selectedUserID,
  setAssignmentGrade,
  setGradeSummaries,
  currentSkill,
  setCurrentSkill,
}) {
  const selectedAssignmentID = selectedAssignment?.assignmentID;
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  const savedPointAdjustment = assignmentGrade?.pointAdjustment || 0;
  const [confirmReset, setConfirmReset] = useState("");

  const [totalPoints, setTotalPoints] = useState(
    totalEarnedPoints + savedPointAdjustment
  );

  useEffect(
    () => setTotalPoints(() => totalEarnedPoints + savedPointAdjustment),
    [totalEarnedPoints, savedPointAdjustment]
  );

  const handleConfirmReset = (event) => {
    setConfirmReset(() => event.target.value);
  };

  const handlePointChange = (e) => {
    setTotalPoints(() => e.target.value);
  };

  const userGradeSummary = gradeSummaries?.find(
    (summary) => summary.userID === selectedUserID
  );
  const userDisplayName = userGradeSummary?.userDisplayName;

  async function clearQuestionSetResponses() {
    const updatedSummaries = gradeSummaries.map((summary) =>
      selectedUserID === summary.userID
        ? deleteAssignmentScore(summary, selectedAssignmentID)
        : summary
    );
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(selectedUserID)
      .update({
        [selectedAssignmentID]: firebase.firestore.FieldValue.delete(),
      });

    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(selectedAssignmentID)
      .collection("results")
      .doc(selectedUserID)
      .delete()
      .then(() => {
        setGradeSummaries(updatedSummaries);
        closeModal();
      });
  }

  async function savePointAdjustment() {
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(selectedUserID)
      .update({
        [`${selectedAssignmentID}.pointAdjustment`]:
          totalPoints - totalEarnedPoints,
      })
      .then(() =>
        setAssignmentGrade({
          ...assignmentGrade,
          pointAdjustment: totalPoints - totalEarnedPoints,
        })
      );
  }

  if (!selectedQuestionSet) return null;

  return (
    <Modal
      className="flex-center-all"
      open={previewOpen}
      onClose={() => {
        closeModal();
        setTotalPoints(() => totalEarnedPoints + savedPointAdjustment);
      }}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={previewOpen}>
        <Box className="modal-form-v2 modal-common-styling flex-column">
          <Card
            className="question-set-display-card relative"
            style={{
              minWidth: "300px",
              minHeight: "180px",
              overflow: "auto",
            }}
          >
            <CardContent>
              <Typography
                display="inline"
                color="textSecondary"
                variant="h6"
                style={{ marginRight: "20px" }}
              >
                {selectedQuestionSet.title}
              </Typography>

              <Typography color="textSecondary" variant="subtitle1">
                results for {userDisplayName}
              </Typography>
              <Box style={{ position: "absolute", right: "40px", top: "35px" }}>
                <TextField
                  display="inline"
                  variant="outlined"
                  inputProps={{
                    min: 0,
                    style: { padding: 4, textAlign: "center" },
                  }}
                  style={{ width: "50px", marginRight: "5px" }}
                  type="number"
                  defaultValue={() => totalEarnedPoints + savedPointAdjustment}
                  value={totalPoints}
                  onChange={handlePointChange}
                />
                <Typography display="inline" style={{ marginRight: "20px" }}>
                  / {totalPossiblePoints} points
                </Typography>
                <Button
                  onClick={() => savePointAdjustment()}
                  disabled={
                    totalPoints === totalEarnedPoints + savedPointAdjustment
                  }
                  variant="contained"
                  color="primary"
                  style={{ position: "relative", bottom: "3px" }}
                >
                  UPDATE
                </Button>

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
              </Box>
              <br />
              <Typography
                display="inline"
                style={{
                  marginTop: "30px",
                  marginBottom: "10px",
                  width: "600px",
                }}
                color="textSecondary"
                variant="subtitle2"
              >
                To clear all saved responses to this student's question set,
                type <strong>reset</strong>:
              </Typography>
              <TextField
                style={{
                  maxWidth: "100px",
                  marginRight: "20px",
                  marginLeft: "20px",
                }}
                inputProps={{
                  style: { padding: 8 },
                }}
                variant="outlined"
                placeholder="reset"
                onChange={handleConfirmReset}
              />
              <Button
                display="inline"
                onClick={() => clearQuestionSetResponses()}
                color="primary"
                variant="contained"
                disabled={confirmReset !== "reset"}
              >
                RESET
              </Button>
              {assignmentGrade?.pendingFreeResponseReview?.length > 0 && (
                <Box>
                  <Typography style={{ color: "red" }}>
                    Questions Pending Review:{" "}
                    {assignmentGrade.pendingFreeResponseReview?.join(", ")}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          <hr />
          <QuestionSetCard
            assignmentGrade={assignmentGrade}
            assignmentID={selectedAssignment.assignmentID}
            collection="courses"
            courseID={courseID}
            instructorView={true}
            questionSet={selectedQuestionSet}
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

async function updateStudentUploadGrade(
  courseID,
  assignmentID,
  userID,
  points,
  gradeSummaries,
  setGradeSummaries
) {
  const updatedSummaries = gradeSummaries.map((summary) =>
    userID === summary.userID
      ? updateAssignmentScore(summary, assignmentID, points)
      : summary
  );

  const gradeSummaryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  await gradeSummaryRef.update({
    [`${assignmentID}.totalEarnedPoints`]: points,
  });
  setGradeSummaries(updatedSummaries);
}

function deleteAssignmentScore(summary, assignmentID) {
  delete summary[assignmentID];
  return summary;
}

function updateAssignmentScore(summary, assignmentID, points) {
  summary[assignmentID].totalEarnedPoints = points;
  return summary;
}
