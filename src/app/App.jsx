import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import WelcomePage from "../components/WelcomePage.jsx";
import MyClassroomPage from "../components/my_classroom/MyClassroomPage.jsx";
import MyContentPage from "../components/my_content/MyContentPage.jsx";
import CommunityPage from "../components/community/CommunityPage.jsx";
import MyProfilePage from "../components/my_profile/MyProfilePage.jsx";
import StudentCourseView from "../components/my_classroom/StudentCourseView.jsx";
import InstructorCourseView from "../components/my_classroom/InstructorCourseView.jsx";
import AccessRestricted from "../components/AccessRestricted.jsx";
import Support from "../components/Support.jsx";
import Emailer from "../components/sandbox/email";
import { AuthProvider } from "./contexts/AuthContext.js";
import PrivateRoute from "./PrivateRoute.js";
import WhiteboardFullscreen from "../components/WhiteboardFullscreen.jsx";
import MolecularEditor from "../components/sandbox/MolecularEditor.jsx";
import LibraryTagUploader from "../components/sandbox/LibraryTagUploader";
import AddStudents from "../components/sandbox/UpdateCourseStudents";
import ScoreValidation from "../components/sandbox/ScoreValidation";
import UpdateOrgIDs from "../components/sandbox/UpdateOrganizationIDs.jsx";
import ReportedIssues from "../components/ReportedIssues.jsx";
import UpdateLastNameFirstName from "../components/sandbox/updateLastNameFirstName";
import { updateFaviconAndTitleForCurrentEnvironment } from "./utils/utils.js";
import LoginImpersonate from "../components/user_authentication/loginImpersonate.jsx";
import AdminPage from "./../components/admin/AdminPage";
import CloneCourse from "./../components/admin/CloneCourse";
import UserPermissions from "./../components/admin/UserPermissions";

updateFaviconAndTitleForCurrentEnvironment();

function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/" exact component={WelcomePage} />
          <PrivateRoute path="/classroom" exact component={MyClassroomPage} />
          <PrivateRoute
            path="/classroom/courses/:courseID"
            exact
            component={StudentCourseView}
          />
          <PrivateRoute
            path="/classroom/courses/:courseID/dashboard"
            exact
            component={InstructorCourseView}
          />
          <PrivateRoute path="/content" exact component={MyContentPage} />
          <PrivateRoute path="/community" exact component={CommunityPage} />
          <PrivateRoute path="/my_profile" exact component={MyProfilePage} />
          <PrivateRoute path="/admin" exact component={AdminPage} />
          <Route path="/access_restricted" component={AccessRestricted} />
          <Route path="/emailer" component={Emailer} />
          <Route
            path="/whiteboard/fullscreen"
            component={WhiteboardFullscreen}
          />
          <Route path="/molecular_editor" exact component={MolecularEditor} />
          <Route path="/tag_uploader" exact component={LibraryTagUploader} />
          <Route path="/support" exact component={Support} />
          <Route path="/addStudents" exact component={AddStudents} />
          <Route path="/scoreValidation" exact component={ScoreValidation} />
          <Route
            path="/UpdateLastNameFirstName"
            exact
            component={UpdateLastNameFirstName}
          />
          <PrivateRoute path="/clone_course" exact component={CloneCourse} />
          <Route path="/reported_issues" exact component={ReportedIssues} />
          <Route path="/update_org_ids" exact component={UpdateOrgIDs} />
          <PrivateRoute
            path="/impersonate"
            exact
            component={LoginImpersonate}
          />
          <PrivateRoute
            path="/userPermissions"
            exact
            component={UserPermissions}
          />
        </Switch>
      </AuthProvider>
    </Router>
  );
}

export default App;
