import React from "react";
import { Box, Typography } from "@material-ui/core";
import { Card, CardContent, CardMedia } from "@material-ui/core";
import { CardActionArea } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { getInstructorNames } from "../../app/utils/utils";

export default function InstructorCourseCard(props) {
  const history = useHistory();

  return (
    <Card className="course-card">
      <CardActionArea
        onClick={() =>
          history.push(`/classroom/courses/${props.courseID}/dashboard`)
        }
        className="full-height"
      >
        <Box className="instructor-label-container">
          <Typography className="instructor-label">instructor</Typography>
        </Box>
        {typeof props.coursePicture !== "undefined" ? (
          <CardMedia
            className="course-card-picture"
            image={props.coursePicture.url}
          />
        ) : (
          <CardMedia
            className="course-card-picture"
            image={process.env.REACT_APP_DEFAULT_COURSE_IMAGE}
          />
        )}

        <CardContent className="course-card-content">
          <Typography variant="h6" color="textPrimary">
            {props.title}
          </Typography>

          <Typography color="secondary" variant="subtitle1">
            {getInstructorNames(props.instructors, props.hiddenAdmins)}
          </Typography>

          <Typography variant="subtitle2" color="textSecondary">
            {props.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
