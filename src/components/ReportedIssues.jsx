import firebase from "../app/config/firebaseConfig.js";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  Modal,
  TextField,
  Typography,
} from "@material-ui/core";
import { useEffect, useState } from "react";
import { extractDate } from "../app/utils/utils";
import { Alert } from "@material-ui/lab";
import { useAuth } from "../app/contexts/AuthContext.js";
import { useHistory } from "react-router-dom";
import { fetchUserPermissions } from "../app/firestoreClient.js";
import QuestionSetCard from "./my_classroom/question_set_display/QuestionSetCard";

export default function ReportedIssues({ courseID }) {
  const grayborders = { border: "1px solid black", borderCollapse: "collapse" };
  const [reportedProblems, setReportedProblems] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState({});
  const [gradeSummaries, setGradeSummaries] = useState([]);
  const [qSetPreviewOpen, setQSetPreviewOpen] = useState(false);
  const [reportAProblemQuestionID, setReportAProblemQuestionID] = useState("");
  const [selectedUserID, setSelectedUserID] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState({});
  const [assignmentGrade, setAssignmentGrade] = useState({});
  const [selectedCourseID, setSelectedCourseID] = useState("");
  const { currentUser } = useAuth();
  const history = useHistory();

  async function fetchQuestionSet(docRef) {
    let doc = await firebase.firestore().doc(docRef).get();

    setSelectedQuestionSet({ id: doc.id, ...doc.data() });
  }

  async function getAssignmentGrade(courseID, userID, assignmentID) {
    let doc = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(userID)
      .get();

    setAssignmentGrade({
      assignmentType: doc.data()[assignmentID]?.assignmentType,
      totalEarnedPoints: doc.data()[assignmentID]?.totalEarnedPoints,
      totalPossiblePoints: doc.data()[assignmentID]?.totalPossiblePoints,
    });
  }

  const closeQSetPreview = () => {
    setQSetPreviewOpen(false);
  };

  async function markAsResolved(issueID) {
    setUpdatingStatus(issueID);
    await firebase
      .firestore()
      .collection("report_a_problem")
      .doc(issueID)
      .update({ resolved: true })
      .then(() => setUpdatingStatus(false))
      .catch(() => setUpdatingStatus(false));
  }

  async function markAsUnresolved(issueID) {
    setUpdatingStatus(issueID);
    await firebase
      .firestore()
      .collection("report_a_problem")
      .doc(issueID)
      .update({ resolved: false })
      .then(() => setUpdatingStatus(false))
      .catch(() => setUpdatingStatus(false));
  }

  async function restrictUnauthorizedAccess(user, history) {
    let userPermissions = await fetchUserPermissions(user.uid);

    if (!userPermissions?.includes("admin")) {
      history.push("/access_restricted");
    }
  }

  useEffect(() => {
    let isCourseInstructor = courseID ? true : false;
    if (!isCourseInstructor) {
      restrictUnauthorizedAccess(currentUser, history);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchReportedProblems();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  function fetchReportedProblems() {
    let ref = firebase
      .firestore()
      .collection("report_a_problem")
      .orderBy("created", "desc");

    if (courseID) {
      ref = ref.where("courseID", "==", courseID);
    }

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
          created: doc.data().created?.toDate() || null,
        });
      });
      setReportedProblems((prevState) => fetchedItems);
    });
  }
  return (
    <Box className="overflow-auto full-height full-width">
      <Box className="padding-medium">
        <table className="padding-medium" style={grayborders}>
          <tr>
            {!courseID && (
              <th align="left">
                <Typography>Course ID / Name</Typography>
              </th>
            )}
            <th>
              <Typography>Problem</Typography>
            </th>
            <th>
              <Typography>User</Typography>
            </th>
            <th>
              <Typography>Issue</Typography>
            </th>
            <th>
              <Typography>Timestamp</Typography>
            </th>
            <th>
              <Typography>Status</Typography>
            </th>
          </tr>
          {reportedProblems.map((problem) => (
            <tr className="padding-light" style={grayborders}>
              {!courseID && (
                <td>
                  <Box width="250px" className="padding-light">
                    <Typography variant="subtitle2">
                      {problem.courseTitle}
                    </Typography>
                    <Typography variant="caption">
                      {problem.courseID}
                    </Typography>
                  </Box>
                </td>
              )}
              <td>
                <Box width="200px" className="padding-light">
                  <Typography variant="subtitle2">
                    {problem.question?.id}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    libraryID:{" "}
                    {problem.question?.libraryID || problem.libraryID || "N/A"}
                  </Typography>
                  <br />
                  {problem?.docRef && (
                    <Button
                      color="primary"
                      onClick={() => {
                        openQuestionModal(problem);
                      }}
                    >
                      View Question
                    </Button>
                  )}
                  <br />
                </Box>
              </td>
              <td>
                <Box width="200px" className="padding-light">
                  {problem.userDisplayName ? (
                    <Typography variant="subtitle2">
                      {problem.userDisplayName}
                    </Typography>
                  ) : (
                    <Typography variant="subtitle2" color="textSecondary">
                      (no display name)
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    display="block"
                  >
                    {problem.userID}
                  </Typography>
                  {problem.userEmail && (
                    <Typography variant="caption" color="textSecondary">
                      {problem.userEmail}
                    </Typography>
                  )}
                </Box>
              </td>
              <td>
                <Box width="300px" className="padding-light">
                  <Typography variant="subtitle2">
                    {problem.description}
                  </Typography>
                </Box>
              </td>
              <td>
                <Box width="150px" className="padding-light">
                  {problem.created ? (
                    <Typography variant="subtitle2">
                      {extractDate(problem.created)}
                    </Typography>
                  ) : (
                    <Typography variant="subtitle2" color="textSecondary">
                      N/A
                    </Typography>
                  )}
                </Box>
              </td>
              <td>
                <Box width="150px" className="padding-light relative">
                  {problem.resolved ? (
                    <>
                      <Alert severity="success">RESOLVED</Alert>
                      <button
                        style={{
                          border: "none",
                          background: "none",
                          position: "absolute",
                          color: "gray",
                          top: "40px",
                          left: "55px",
                        }}
                        className="hover-pointer"
                        color="textSecondary"
                        onClick={() => markAsUnresolved(problem.id)}
                      >
                        undo
                      </button>
                    </>
                  ) : (
                    <Button
                      onClick={() => markAsResolved(problem.id)}
                      size="small"
                    >
                      mark as resolved
                    </Button>
                  )}
                  {updatingStatus === problem.id && (
                    <Typography variant="subtitle2" color="textSecondary">
                      updating status...
                    </Typography>
                  )}
                </Box>
              </td>
            </tr>
          ))}
        </table>
      </Box>
      <QuestionSetModal
        assignmentGrade={assignmentGrade}
        closeModal={closeQSetPreview}
        courseID={courseID || selectedCourseID}
        gradeSummaries={gradeSummaries}
        previewOpen={qSetPreviewOpen}
        selectedAssignment={selectedAssignment}
        selectedQuestionSet={selectedQuestionSet}
        selectedUserID={selectedUserID}
        setAssignmentGrade={setAssignmentGrade} //TODO
        setGradeSummaries={setGradeSummaries} //TODO
        reportAProblemQuestionID={reportAProblemQuestionID}
        // currentSkill={currentSkill}
        // setCurrentSkill={setCurrentSkill}
      />
    </Box>
  );

  function openQuestionModal(problem) {
    getAssignmentGrade(problem.courseID, problem.userID, problem.assignmentID);
    fetchQuestionSet(problem?.docRef);
    setQSetPreviewOpen(true);
    setSelectedUserID(problem.userID);
    setSelectedCourseID(problem?.courseID);
    setReportAProblemQuestionID(problem.question?.id);
    setSelectedAssignment({
      assignmentID: problem.assignmentID,
    });
    setGradeSummaries([
      {
        userID: problem.userID,
        userDisplayName: problem.userDisplayName,
      },
    ]);
  }
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
  reportAProblemQuestionID,
  currentSkill,
  setCurrentSkill,
}) {
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  const savedPointAdjustment = assignmentGrade?.pointAdjustment || 0;

  const [totalPoints, setTotalPoints] = useState(
    totalEarnedPoints + savedPointAdjustment
  );

  useEffect(
    () => setTotalPoints(() => totalEarnedPoints + savedPointAdjustment),
    [totalEarnedPoints, savedPointAdjustment]
  );

  const handlePointChange = (e) => {
    setTotalPoints(() => e.target.value);
  };

  const userGradeSummary = gradeSummaries?.find(
    (summary) => summary.userID === selectedUserID
  );
  const userDisplayName = userGradeSummary?.userDisplayName;

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
              </Box>
              <br />
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
            reportAProblemQuestionID={reportAProblemQuestionID}
          />
        </Box>
      </Fade>
    </Modal>
  );
}
