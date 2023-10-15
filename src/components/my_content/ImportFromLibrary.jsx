import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  Modal,
  Select,
  Switch,
  MenuItem,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { Pagination } from "@material-ui/lab";
import RedoRoundedIcon from "@material-ui/icons/RedoRounded";
import firebase from "../../app/config/firebaseConfig.js";
import QuestionPreviewCard from "./question_preview/QuestionPreviewCard";
import {
  countQuestionsInLibrary,
  countQuestionsReturnedFromQuery,
  fetchPage,
  fetchNextPage,
  fetchPreviousPage,
  jumpForwardToPage,
  jumpBackwardToPage,
  QuestionRangeCounter,
} from "./libraryPaginationUtils.js";
import QuestionSnippets from "./QuestionSnippets.jsx";
import LibrarySearchModule from "./LibrarySearchModule.jsx";
import {
  copyQuestionToSet,
  generateTotalPossiblePoints,
} from "../../app/firestoreClient.js";

export default function ImportFromLibrary({
  questionSetID,
  userID,
  userPermissions,
}) {
  const [productLibrariesInfo, setProductLibrariesInfo] = useState([]);
  const [myLibraryInfo, setMyLibraryInfo] = useState({});
  const allLibrariesInfo = [myLibraryInfo, ...productLibrariesInfo];
  const [libraryIndex, setLibraryIndex] = useState(-1);
  const currentLibrary = allLibrariesInfo[libraryIndex];
  const [libraryQuestions, setLibraryQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const [searchTerms, setSearchTerms] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [includeAll, setIncludeAll] = useState(false);
  const orderBy = currentLibrary?.orderBy;
  const questionsPerPage = 10;
  const [firstDoc, setFirstDoc] = useState({});
  const [lastDoc, setLastDoc] = useState({});
  const pageCount =
    searchTerms.length > 0
      ? Math.ceil(queryCount / questionsPerPage)
      : Math.ceil(questionCount / questionsPerPage);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedForImport, setSelectedForImport] = useState([]);
  const [importing, setImporting] = useState(false);
  const [seeSelectedOnly, setSeeSelectedOnly] = useState(false);

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setLibraryIndex(-1);
    setLibraryQuestions([]);
    setQuestionCount(0);
    setQueryCount(0);
    setSearchTerms([]);
    setSelectedQuestions([]);
    setSelectedForImport([]);
  };

  const handleClose = () => {
    setOpen(false);
    setLibraryIndex(-1);
    setLibraryQuestions([]);
    setQuestionCount(0);
    setQueryCount(0);
    setSearchTerms([]);
    setSelectedQuestion({});
    setSelectedQuestions([]);
    setSelectedForImport([]);
  };

  const myLibraryInfoRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID);

  const productLibraryInfoRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(currentLibrary?.id || "placeholderID");

  const myLibraryRef = myLibraryInfoRef.collection("my_library");

  const productLibraryRef = productLibraryInfoRef.collection("questions");

  const libraryInfoRef =
    libraryIndex === 0 ? myLibraryInfoRef : productLibraryInfoRef;
  const libraryRef = libraryIndex === 0 ? myLibraryRef : productLibraryRef;

  function fetchMyLibraryInfo() {
    myLibraryInfoRef.onSnapshot((snapshot) => {
      const fetchedItem = snapshot.data();
      fetchedItem.title = "My Library";

      setMyLibraryInfo((prevState) => fetchedItem);
    });
  }

  function fetchProductLibrariesInfo() {
    firebase
      .firestore()
      .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
      .where("type", "==", "question library")
      .onSnapshot((snapshot) => {
        const fetchedItems = [];
        snapshot.forEach((doc) => {
          if (
            userPermissions?.includes("editQuestionLibraries") ||
            userPermissions?.includes(doc.id)
          )
            fetchedItems.push({
              id: doc.id,
              ...doc.data(),
            });
        });
        setProductLibrariesInfo((prevState) => fetchedItems);
      });
  }

  //==============================================================================================//
  //======================================= Page Navigation ======================================//

  const handlePageChange = (event, selectedPage) => {
    const numPagesToTraverse = selectedPage - currentPage;
    if (numPagesToTraverse === 0) return;

    setIsFetching(true);

    if (numPagesToTraverse === 1) {
      setCurrentPage(selectedPage);
      fetchNextPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    } else if (numPagesToTraverse === -1) {
      setCurrentPage(selectedPage);
      fetchPreviousPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    } else if (numPagesToTraverse > 1) {
      setCurrentPage(selectedPage);
      jumpForwardToPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    } else if (numPagesToTraverse < -1) {
      setCurrentPage(selectedPage);
      jumpBackwardToPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    }
  };

  //==============================================================================================//
  //=======================---=========== other functions ========================================//

  function setDisplayedQuestions(fetchedItems) {
    setLibraryQuestions(() => fetchedItems);
    setFirstDoc((prev) => fetchedItems[0]);
    setLastDoc((prev) => fetchedItems[fetchedItems.length - 1]);
  }

  const handleLibraryChange = (event) => {
    setLibraryIndex((prevIndex) => event.target.value);
    setCurrentPage(() => 1);
  };

  useEffect(() => {
    fetchProductLibrariesInfo();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMyLibraryInfo();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (libraryIndex >= 0) {
      countQuestionsInLibrary(libraryInfoRef, libraryRef, setQuestionCount);
      fetchPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    }
    // eslint-disable-next-line
  }, [currentLibrary]);

  useEffect(() => {
    setCurrentPage(() => 1);
    countQuestionsReturnedFromQuery(
      libraryRef,
      searchTerms,
      includeAll,
      setQueryCount
    );
    setIsFetching(true);
    fetchPage(
      libraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions,
      setIsFetching
    );
    // eslint-disable-next-line
  }, [searchTerms, includeAll]);

  function checkIfSelected() {
    const selectedIDs = selectedQuestions?.map((question) => question.id);
    const isSelected = libraryQuestions?.map((question) =>
      selectedIDs.includes(question.id)
    );
    setSelectedForImport(isSelected);
  }

  useEffect(
    () => checkIfSelected(),
    // eslint-disable-next-line
    [selectedQuestions, libraryQuestions]
  );

  const handleSeeSelected = (event) => {
    setSeeSelectedOnly(event.target.checked);
    if (event.target.checked) {
      setLibraryQuestions(selectedQuestions);
      setQuestionCount(selectedQuestions.length);
    } else if (!event.target.checked) {
      countQuestionsInLibrary(libraryInfoRef, libraryRef, setQuestionCount);
      fetchPage(
        libraryRef,
        orderBy,
        questionsPerPage,
        searchTerms,
        includeAll,
        setDisplayedQuestions,
        setIsFetching
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<RedoRoundedIcon />}
      >
        Import
      </Button>
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
          <Box className="modal-form-v2 modal-common-styling flex">
            <Box className="question-list-panel">
              <Box className="select-or-add-library align-center" width="100%">
                <Select
                  value={libraryIndex}
                  onChange={handleLibraryChange}
                  displayEmpty
                  variant="outlined"
                >
                  <MenuItem value={-1} disabled>
                    <Typography color="textSecondary">
                      select a library
                    </Typography>
                  </MenuItem>
                  {allLibrariesInfo.map((library, libIndex) => (
                    <MenuItem key={`library${libIndex}`} value={libIndex}>
                      {library.title}
                    </MenuItem>
                  ))}
                </Select>
                <Box>
                  <Switch
                    color="primary"
                    disabled={selectedQuestions.length < 1}
                    checked={seeSelectedOnly || false}
                    onChange={handleSeeSelected}
                  />
                  <Typography display="inline">see selected only</Typography>
                </Box>
              </Box>
              <LibrarySearchModule
                currentLibrary={currentLibrary}
                includeAll={includeAll}
                searchTerms={searchTerms}
                setSearchTerms={setSearchTerms}
                setIncludeAll={setIncludeAll}
              />
              <QuestionSnippets
                currentLibrary={currentLibrary}
                currentPage={currentPage}
                importList={selectedQuestions}
                isFetching={isFetching}
                libraryImport={true}
                libraryIndex={libraryIndex}
                productLibraryID={currentLibrary?.id}
                queryCount={queryCount}
                questions={libraryQuestions}
                searchTerms={searchTerms}
                selectedForImport={selectedForImport}
                setCurrentPage={setCurrentPage}
                setImportList={setSelectedQuestions}
                setQueryCount={setQueryCount}
                setSelectedForImport={setSelectedForImport}
                setSelectedQuestion={setSelectedQuestion}
                userID={userID}
              />
              <QuestionRangeCounter
                searchTerms={searchTerms}
                questionsPerPage={questionsPerPage}
                currentPage={currentPage}
                queryCount={queryCount}
                questionCount={questionCount}
              />
              {pageCount > 0 && !seeSelectedOnly ? (
                <Box className="flex-center-all pagination-nav">
                  <Pagination
                    count={pageCount}
                    size="small"
                    page={currentPage}
                    disabled={isFetching}
                    onChange={handlePageChange}
                  />
                </Box>
              ) : null}

              <Box className="padding-top-light">
                <Button
                  disabled={selectedQuestions.length < 1}
                  fullWidth
                  className="margin-auto"
                  size="large"
                  color="primary"
                  variant="contained"
                  onClick={() =>
                    importQuestions(
                      questionSetID,
                      selectedQuestions,
                      userID,
                      setImporting,
                      handleClose
                    )
                  }
                >
                  {importing === true ? (
                    <CircularProgress size={25} />
                  ) : (
                    "IMPORT"
                  )}
                </Button>
              </Box>
            </Box>

            <Box className="flex-center-all">
              <QuestionPreviewCard
                disableEdit={true}
                libraryQuestionID={selectedQuestion?.id}
                license={currentLibrary?.license}
                productLibraryID={currentLibrary?.id}
                question={selectedQuestion}
              />
            </Box>

            {/* <pre>{JSON.stringify(selectedForImport, null, 2)}</pre> */}
            {/* <pre>{JSON.stringify(selectedQuestions, null, 2)}</pre> */}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

async function importQuestions(
  questionSetID,
  selectedQuestions,
  userID,
  setImporting,
  handleClose
) {
  setImporting(true);
  //Artificial delay to signal user that question info is being saved
  await new Promise((r) => setTimeout(r, 800));
  copyQuestionToSet(questionSetID, selectedQuestions, userID);
  generateTotalPossiblePoints(questionSetID, userID);
  setImporting(false);
  handleClose();
}
