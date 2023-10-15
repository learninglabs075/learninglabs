import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Card,
  Switch,
  Typography,
  Tooltip,
} from "@material-ui/core";
import { DragIndicator, ExpandMore } from "@material-ui/icons/";
import { makeStyles } from "@material-ui/core/styles";
import AddModule from "./AddModule.jsx";
import AddModuleContent from "./AddModuleContent.jsx";
import ContentCard from "./ContentCard.jsx";
import {
  deleteCourseModule,
  updateCourseModuleOrder,
  updateCourseModuleContentOrder,
  updateCourseModuleContent,
} from "../../app/firestoreClient.js";
import EditModuleTitle from "./EditModuleTitle.jsx";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const CourseModulesStyles = makeStyles((theme) => ({
  moduleTitleBar: {
    backgroundColor: "#F0F0F0",
  },
  moduleHeader: {
    display: "flex",
    alignItems: "center",
    marginLeft: 40,
  },
  moduleTitle: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  moduleBody: {
    backgroundColor: "#F5F5F5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    paddingTop: 10,
    paddingBottom: 35,
  },
  editTitleContainer: {
    position: "absolute",
    left: 40,
    top: -48,
  },
  deleteButtonContainer: {
    position: "relative",
    top: 20,
  },
  deleteModuleButton: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: "16px",
    color: "silver",
    "&:hover": {
      cursor: "pointer",
      color: "#79c2d3",
    },
  },
  dragIcon: {
    cursor: "move",
    color: "rgba(0,0,0,0.2)",
    margin: "auto",
  },
}));

export default function CourseModules({
  userID,
  courseID,
  modules,
  courseInfo,
  setCourseInfo,
}) {
  const classes = CourseModulesStyles();

  const onDragEnd = async (result) => {
    const { destination, source } = result;

    if (!destination) return;

    const notReordered =
      destination?.droppableId === source.droppableId &&
      destination?.index === source.index;

    if (notReordered) return;

    if (source.droppableId === "droppableModule") {
      const reorderedModules = generateReorderedModules(source, destination);
      await updateCourseModuleOrder(courseID, reorderedModules);
      return;
    }

    var { currentModuleIndex, reorderedContent } =
      generateReorderedModuleContents(destination, source);

    await updateCourseModuleContentOrder(
      courseID,
      currentModuleIndex,
      reorderedContent
    );
  };

  async function updateModuleVisibility(
    courseID,
    module,
    moduleIndex,
    checked
  ) {
    const updatedModules = [...module];
    updatedModules[moduleIndex].visible = checked;
    await updateCourseModuleContent(courseID, updatedModules);
    setCourseInfo({ ...courseInfo, modules: updatedModules });
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppableModule" type="QUESTIONS">
          {(provided, snapshot) => (
            <div ref={provided.innerRef}>
              {modules?.map((module, moduleIndex) => (
                <Draggable
                  key={module.title}
                  draggableId={module.title}
                  index={moduleIndex}
                >
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <Accordion key={moduleIndex}>
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          className={classes.moduleTitleBar}
                          aria-controls="module-title-bar"
                        >
                          <span {...provided.dragHandleProps}>
                            <DragIndicator
                              className={classes.dragIcon}
                              fontSize="medium"
                              id="draggable-dialog-title"
                            />
                          </span>
                          <Box className={classes.moduleHeader}>
                            {module.title === "" ? (
                              <Typography
                                color="textSecondary"
                                className={classes.moduleTitle}
                              >
                                (no title entered)
                              </Typography>
                            ) : (
                              <Typography className={classes.heading}>
                                {module.title}
                              </Typography>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails
                          className={classes.moduleBody}
                          style={{ position: "relative" }}
                        >
                          {modules[moduleIndex]?.content?.length > 0 && (
                            <Box display="flex" position="absolute" right={20}>
                              <Tooltip
                                title={`${
                                  module?.visible ||
                                  module?.visible === undefined
                                    ? `Hide`
                                    : `Show`
                                } Module`}
                                placement="left"
                              >
                                <Switch
                                  label="Hide Module"
                                  checked={
                                    module?.visible ||
                                    module?.visible === undefined
                                      ? true
                                      : false
                                  }
                                  onChange={(e) => {
                                    updateModuleVisibility(
                                      courseID,
                                      modules,
                                      moduleIndex,
                                      e.target.checked
                                    );
                                  }}
                                  name="checkedB"
                                  color="primary"
                                />
                              </Tooltip>
                            </Box>
                          )}

                          <Box className={classes.editTitleContainer}>
                            <EditModuleTitle
                              courseID={courseID}
                              modules={modules}
                              moduleIndex={moduleIndex}
                            />
                          </Box>
                          {modules[moduleIndex].content.length === 0 && (
                            <Box height={80} />
                          )}
                          <Droppable
                            droppableId={`droppable${module.title}`}
                            type={`${moduleIndex}`}
                          >
                            {(provided) => (
                              <div ref={provided.innerRef}>
                                {modules[moduleIndex]?.content?.map(
                                  (item, index) => {
                                    return (
                                      <Draggable
                                        key={`${moduleIndex}${index}`}
                                        draggableId={`${moduleIndex}${index}`}
                                        index={index}
                                      >
                                        {(provided) => (
                                          <div
                                            style={{
                                              marginBottom: "15px",
                                              marginLeft: "20px",
                                              marginRight: "20px",
                                            }}
                                          >
                                            <Card
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="flex whitesmoke"
                                            >
                                              <DragIndicator
                                                className={classes.dragIcon}
                                                fontSize="medium"
                                                id="draggable-module-item"
                                              />
                                              <ContentCard
                                                key={`item${index}`}
                                                userID={userID}
                                                courseID={courseID}
                                                courseTitle={courseInfo.title}
                                                item={item}
                                                modules={modules}
                                                moduleIndex={moduleIndex}
                                                content={
                                                  modules[moduleIndex].content
                                                }
                                                contentIndex={index}
                                              />
                                            </Card>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  }
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <AddModuleContent
                            userID={userID}
                            courseID={courseID}
                            courseTitle={courseInfo.title}
                            modules={modules}
                            moduleIndex={moduleIndex}
                          />
                          <Box className={classes.deleteButtonContainer}>
                            <button
                              className={classes.deleteModuleButton}
                              onClick={() => {
                                module?.content?.length === 0
                                  ? deleteModuleIfNoResultsSubmitted(
                                      module,
                                      courseID
                                    )
                                  : alert(
                                      //TODO: convert to material-ui alert
                                      "There are assignments/resources currently associated with this module.  Please delete them first."
                                    );
                              }}
                            >
                              <Typography variant="subtitle2">
                                DELETE MODULE
                              </Typography>
                            </button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Box display="flex" justifyContent="center">
        <AddModule courseID={courseID} />
      </Box>
    </>
  );

  function generateReorderedModules(source, destination) {
    const reorderedModules = [...modules];
    const [removed] = reorderedModules.splice(source.index, 1);
    reorderedModules.splice(destination.index, 0, removed);

    let courseInfoDNDAntiFlicker = JSON.parse(JSON.stringify(courseInfo));
    courseInfoDNDAntiFlicker.modules = reorderedModules;
    setCourseInfo(() => courseInfoDNDAntiFlicker);
    return reorderedModules;
  }

  function generateReorderedModuleContents(destination, source) {
    let currentModule = destination.droppableId.replace("droppable", "");
    let currentModuleIndex = modules.findIndex(
      (module) => module.title === currentModule
    );

    const reorderedContent = [...modules[currentModuleIndex].content];
    const [removed] = reorderedContent.splice(source.index, 1);
    reorderedContent.splice(destination.index, 0, removed);

    let courseInfoDNDAntiFlicker = JSON.parse(JSON.stringify(courseInfo));
    courseInfoDNDAntiFlicker.modules[currentModuleIndex].content =
      reorderedContent;
    setCourseInfo(() => courseInfoDNDAntiFlicker);
    return { currentModuleIndex, reorderedContent };
  }
}
function deleteModuleIfNoResultsSubmitted(module, courseID) {
  const firstResultSubmitted = module?.content.some(
    (item) => item.firstResultSubmitted
  );

  module?.content?.length === 0 || !firstResultSubmitted
    ? deleteCourseModule(module, courseID)
    : alert(
        "Assignments in this module already have results submitted.  Please contact support for assistance."
      );
}
