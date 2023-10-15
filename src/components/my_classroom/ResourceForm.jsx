import React, { useState, useEffect } from "react";
import { Formik, Field, Form } from "formik";
import { updateCourseModuleContent } from "../../app/firestoreClient.js";
import { Box, Button, Typography } from "@material-ui/core";
import { Radio } from "@material-ui/core";
import { CircularProgress } from "@material-ui/core";
import { Select, MenuItem } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";

const SelectItem = (props) => <Select variant="outlined" {...props} />;

export default function ResourceForm({
  userID,
  courseID,
  modules,
  moduleIndex,
  content,
  contentIndex,
  closeResourceForm,
  item,
  edit,
}) {
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [images, setImages] = useState([]);
  const add = !edit;

  function addModuleResource(tidiedValues) {
    const updatedModules = modules.map((element, index) => {
      if (index === moduleIndex) {
        element.content.push(tidiedValues);
      }
      return element;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function updateModuleResource(tidiedValues) {
    const updatedContent = content.map((item, index) =>
      index === contentIndex ? tidiedValues : item
    );
    const updatedModules = modules.map((module, index) => {
      if (index === moduleIndex) {
        module.content = updatedContent;
      }
      return module;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function fetchMyDocuments() {
    const ref = firebase
      .firestore()
      .collection("user_files")
      .doc(userID)
      .collection("documents")
      .orderBy("name", "asc");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setDocuments((prevState) => fetchedItems);
    });
  }

  function fetchMyImages() {
    const ref = firebase
      .firestore()
      .collection("user_files")
      .doc(userID)
      .collection("images");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setImages((prevState) => fetchedItems);
    });
  }

  function fetchMyLinks() {
    const ref = firebase
      .firestore()
      .collection("user_links")
      .doc(userID)
      .collection("urls");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setLinks((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyDocuments();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMyImages();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMyLinks();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Formik
      initialValues={pickInitialValues(item, edit)}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        if (add) addModuleResource(tidy(values));
        if (edit) updateModuleResource(tidy(values));
        setSubmitting(false);
        closeResourceForm();
      }}
    >
      {({ values, isSubmitting, dirty, handleChange, setFieldValue }) => (
        <Form autoComplete="off">
          <Typography variant="h5" color="primary">
            {edit ? "Update Resource" : "Add Resource"}
          </Typography>

          <Box className="padding-light" width={350}>
            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="document"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("name", "");
                  setFieldValue("url", "");
                  setFieldValue("docRef", "");
                  setFieldValue("title", "");
                  setFieldValue("description", "");
                  setFieldValue("size", 0);
                }}
              />
              <Typography>Document</Typography>
            </Box>

            {values.itemType === "document" && (
              <Box className="select-module-item">
                <Field
                  as={SelectItem}
                  onChange={handleChange}
                  name="id"
                  inputProps={{ "aria-label": "Select a document" }}
                >
                  <MenuItem value="placeholder" disabled>
                    <Typography color="textSecondary">
                      select a document
                    </Typography>
                  </MenuItem>
                  {documents.map((document) => (
                    <MenuItem
                      key={document.id}
                      value={document.id}
                      onClick={() => {
                        setFieldValue(
                          "docRef",
                          `user_files/${userID}/documents/${document.id}`
                        );
                        setFieldValue("name", document.name);
                        setFieldValue("url", document.url);
                        setFieldValue("size", document.size);
                      }}
                    >
                      {document.name.slice(0, 30)}
                    </MenuItem>
                  ))}
                </Field>
              </Box>
            )}

            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="image"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("name", "");
                  setFieldValue("url", "");
                  setFieldValue("docRef", "");
                  setFieldValue("title", "");
                  setFieldValue("description", "");
                  setFieldValue("size", 0);
                }}
              />
              <Typography>Image</Typography>
            </Box>

            {values.itemType === "image" && (
              <Box className="select-module-item">
                <Field
                  as={SelectItem}
                  onChange={handleChange}
                  name="id"
                  inputProps={{ "aria-label": "Select an image" }}
                >
                  <MenuItem value="placeholder" disabled>
                    <Typography color="textSecondary">
                      select an image
                    </Typography>
                  </MenuItem>
                  {images.map((image) => (
                    <MenuItem
                      key={image.id}
                      value={image.id}
                      onClick={() => {
                        setFieldValue(
                          "docRef",
                          `user_files/${userID}/images/${image.id}`
                        );
                        setFieldValue("name", image.name);
                        setFieldValue("url", image.url);
                        setFieldValue("size", image.size);
                      }}
                    >
                      {image.name.slice(0, 30)}
                    </MenuItem>
                  ))}
                </Field>
              </Box>
            )}

            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="link"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("title", "");
                  setFieldValue("url", "");
                  setFieldValue("docRef", "");
                  setFieldValue("name", "");
                  setFieldValue("size", 0);
                }}
              />
              <Typography>Link</Typography>
            </Box>

            {values.itemType === "link" && (
              <Box className="select-module-item">
                <Field as={SelectItem} onChange={handleChange} name="id">
                  <MenuItem value="placeholder" disabled>
                    <Typography color="textSecondary">select a link</Typography>
                  </MenuItem>
                  {links.map((link) => (
                    <MenuItem
                      key={link.id}
                      value={link.id}
                      onClick={() => {
                        setFieldValue("title", link.title);
                        setFieldValue("description", link.description);
                        setFieldValue("url", link.url);
                        setFieldValue(
                          "docRef",
                          `user_links/${userID}/urls/${link.id}`
                        );
                      }}
                    >
                      {link.title.slice(0, 30)}
                    </MenuItem>
                  ))}
                </Field>
              </Box>
            )}
          </Box>
          <Box className="flex justify-end padding-top-medium">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                !dirty ||
                isSubmitting ||
                values.itemType === "" ||
                values.id === "placeholder"
              }
            >
              {!isSubmitting && add && "ADD"}
              {!isSubmitting && edit && "UPDATE"}
              {isSubmitting && <CircularProgress size={25} />}
            </Button>
          </Box>
          {/* <Box width="400px" className="overflow-auto">
            <pre>{JSON.stringify(values, null, 2)}</pre>
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </Box> */}
        </Form>
      )}
    </Formik>
  );
}

function pickInitialValues(item, edit) {
  if (!edit)
    return {
      id: "placeholder",
      contentType: "resource",
      itemType: "",
      url: "",
      docRef: "",
      title: "",
      description: "",
      name: "",
      size: 0,
    };
  if (edit)
    return {
      id: getIDFromDocRef(item.docRef) || "placeholder",
      contentType: "resource",
      itemType: item.itemType,
      url: item.url || "",
      docRef: item.docRef || "",
      title: item.title || "",
      description: item.description || "",
      name: item.name || "",
      size: item.size || 0,
    };
}

function getIDFromDocRef(docRef) {
  if (!docRef) return;
  if (docRef) {
    const docRefArray = docRef.split("/");
    return docRefArray[docRefArray.length - 1];
  }
}

function tidy(rawValues) {
  if (rawValues.itemType === "document") {
    return {
      contentType: "resource",
      itemType: "document",
      name: rawValues.name,
      size: rawValues.size,
      url: rawValues.url,
      docRef: rawValues.docRef,
    };
  } else if (rawValues.itemType === "image") {
    return {
      contentType: "resource",
      itemType: "image",
      name: rawValues.name,
      size: rawValues.size,
      url: rawValues.url,
      docRef: rawValues.docRef,
    };
  } else if (rawValues.itemType === "link") {
    return {
      contentType: "resource",
      itemType: "link",
      title: rawValues.title,
      description: rawValues.description,
      url: rawValues.url,
      docRef: rawValues.docRef,
    };
  }
}
