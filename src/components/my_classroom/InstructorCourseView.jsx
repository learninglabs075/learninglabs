import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { Box, Button, Divider, Tooltip } from "@material-ui/core";
import { Tabs, Tab } from "@material-ui/core";
import { ChevronLeft, NotificationsActive, People } from "@material-ui/icons";
import { MyClassroomTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import { useHistory } from "react-router-dom";
import firebase from "../../app/config/firebaseConfig.js";
import InstructorGradebook from "./InstructorGradebook.jsx";
import CourseDetails from "./CourseDetails.jsx";
import CourseModules from "./CourseModules.jsx";
import CourseRoster from "./CourseRoster.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import ReportedIssues from "./../ReportedIssues";

function restrictUnauthorizedAccess(user, history, instructors) {
  const isInstructor = instructors?.some(
    (instructor) => instructor.id === user.uid
  );

  if (instructors && !isInstructor) {
    history.push("/access_restricted");
  }
}

export default function InstructorCourseView({ match }) {
  const { currentUser } = useAuth();
  const history = useHistory();
  const [courseInfo, setCourseInfo] = useState({});
  const [tabIndex, setTabIndex] = useState(0);
  const [hasReportedIssues, setHasReportedIssues] = useState(false);
  const handleChange = (event, index) => {
    setTabIndex(index);
  };

  function fetchCourseInfo() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .doc(match.params.courseID);

    ref.onSnapshot((doc) =>
      setCourseInfo({
        id: doc.id,
        courseCode: doc.data()?.courseCode,
        title: doc.data().title,
        coursePicture: doc.data().coursePicture,
        instructors: doc.data().instructors,
        students: doc.data().students,
        invitedStudents: doc.data().invitedStudents,
        availableTo: doc.data().availableTo,
        description: doc.data().description,
        modules: doc.data().modules,
        created: doc.data().created.toDate().toLocaleDateString(),
        isActive: doc.data().isActive,
        hiddenAdmins: doc.data()?.hiddenAdmins,
      })
    );
  }

  function getUnresolvedReportedProblems(match, setHasReportedIssues) {
    return firebase
      .firestore()
      .collection("report_a_problem")
      .where("courseID", "==", match.params.courseID)
      .where("resolved", "!=", true)
      .onSnapshot((snapshot) => {
        snapshot.docs.length > 0
          ? setHasReportedIssues(true)
          : setHasReportedIssues(false);
      });
  }

  useEffect(() => {
    const unsubscribe = fetchCourseInfo();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = getUnresolvedReportedProblems(
      match,
      setHasReportedIssues
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  restrictUnauthorizedAccess(currentUser, history, courseInfo.instructors);

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="course-view-background">
        <MainNavBar />
        <Box className="flex-column display-area-full">
          <Box className="flex-align-center space-between padding-light">
            <Button
              startIcon={<ChevronLeft />}
              onClick={() => history.push("/classroom")}
            >
              BACK TO COURSES
            </Button>
            <Button
              startIcon={<People />}
              href={`/classroom/courses/${courseInfo.id}`}
              rel="noreferrer"
              target="_blank"
            >
              Student View
            </Button>
          </Box>
          <Box className="flex-center-all course-overview">
            <CourseDetails
              courseInfo={courseInfo}
              courseID={courseInfo.id}
              courseCode={courseInfo.courseCode}
              coursePicture={courseInfo.coursePicture}
              title={courseInfo.title}
              description={courseInfo.description}
              instructorNames={courseInfo.instructorNames}
              instructors={courseInfo.instructors}
              availableTo={courseInfo.availableTo}
              created={courseInfo.created}
              isActive={courseInfo.isActive}
              setCourseInfo={setCourseInfo}
              hiddenAdmins={courseInfo.hiddenAdmins}
            />
          </Box>
          <Box padding={2}>
            <Divider />
          </Box>

          <div className="course-management-tools">
            <Tabs
              orientation="vertical"
              value={tabIndex}
              onChange={handleChange}
              className="tool-selected"
            >
              <Tab
                label="Modules"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 0)}
              />
              <Tab
                label="Gradebook"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 1)}
              />
              <Tab
                style={{ display: "flex", alignItems: "right" }}
                label="Roster"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 2)}
              />
              <Box>
                {!hasReportedIssues && (
                  <Tab
                    label="Issues"
                    disableRipple
                    onClick={() => setTabIndex((prevIndex) => 3)}
                    style={{ marginLeft: "20px" }}
                  />
                )}
                {hasReportedIssues && (
                  <>
                    <Tooltip
                      title="There are unresolved issues"
                      placement="top-end"
                    >
                      <Tab
                        label="Issues"
                        disableRipple
                        onClick={() => setTabIndex((prevIndex) => 3)}
                        style={{ marginLeft: "20px" }}
                      />
                    </Tooltip>
                    <NotificationsActive
                      fontSize="small"
                      onClick={() => setTabIndex((prevIndex) => 3)}
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        marginLeft: "-50px",
                        verticalAlign: "sub",
                      }}
                      color="primary"
                    />
                  </>
                )}
              </Box>
            </Tabs>
            {tabIndex === 0 && (
              <Box className="course-utils-display-area margin-x-auto">
                <CourseModules
                  userID={currentUser.uid}
                  courseID={courseInfo.id}
                  modules={courseInfo.modules}
                  courseInfo={courseInfo}
                  setCourseInfo={setCourseInfo}
                />
              </Box>
            )}
            {tabIndex === 1 && (
              <Box className="course-utils-display-area margin-x-auto">
                <InstructorGradebook
                  courseID={courseInfo.id}
                  modules={courseInfo.modules}
                  instructors={courseInfo.instructors}
                />
              </Box>
            )}
            {tabIndex === 2 && (
              <Box className="course-utils-display-area margin-x-auto">
                <CourseRoster
                  courseID={courseInfo.id}
                  courseTitle={courseInfo.title}
                  courseCode={courseInfo.courseCode}
                  students={courseInfo.students}
                  invitedStudents={courseInfo.invitedStudents}
                />
              </Box>
            )}
            {tabIndex === 3 && (
              <Box className="course-utils-display-area margin-x-auto">
                <ReportedIssues courseID={courseInfo.id} />
              </Box>
            )}
          </div>
        </Box>
      </div>
    </ThemeProvider>
  );
}
