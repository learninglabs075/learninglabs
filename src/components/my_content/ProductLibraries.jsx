import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@material-ui/core";
import { Pagination } from "@material-ui/lab";
import AddProductLibrary from "./AddProductLibrary.jsx";
import QuestionBuilder from "./QuestionBuilder.jsx";
import MultipartBuilder from "./MultipartBuilder.jsx";
import QuestionPreviewCard from "./question_preview/QuestionPreviewCard";
import firebase from "../../app/config/firebaseConfig.js";
import QuestionSnippets from "./QuestionSnippets.jsx";
import { artificialDelay } from "../../app/utils/utils.js";
import {
  countQuestionsInLibrary,
  countQuestionsReturnedFromQuery,
  fetchPageWithListener,
  fetchNextPageWithListener,
  fetchPreviousPageWithListener,
  jumpForwardToPageWithListener,
  jumpBackwardToPageWithListener,
  QuestionRangeCounter,
} from "./libraryPaginationUtils.js";
import LibrarySearchModule from "./LibrarySearchModule.jsx";

export default function ProductLibraries(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState({});
  const [lastDoc, setLastDoc] = useState({});
  const [productLibraries, setProductLibraries] = useState([]);
  const [libraryIndex, setLibraryIndex] = useState(-1);
  const [libraryQuestions, setLibraryQuestions] = useState([]);
  const [queryCount, setQueryCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [searchTerms, setSearchTerms] = useState([]);
  const [includeAll, setIncludeAll] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const currentLibrary = productLibraries[libraryIndex];
  const orderBy = currentLibrary?.orderBy;

  const questionsPerPage = 10;
  const pageCount =
    searchTerms.length > 0
      ? Math.ceil(queryCount / questionsPerPage)
      : Math.ceil(questionCount / questionsPerPage);

  //==============================================================================================//
  //================================== Firestore references ======================================//

  const productLibrariesInfoRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .where("type", "==", "question library");

  const productLibraryInfoRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(currentLibrary?.id || "placeholderID");

  const productLibraryRef = productLibraryInfoRef.collection("questions");

  function fetchProductLibraries() {
    productLibrariesInfoRef.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          tags: doc.data().tags,
          orderBy: doc.data().orderBy,
          created: doc.data().created.toDate().toLocaleString(),
          license: doc.data().license,
        });
      });
      setProductLibraries((prevState) => fetchedItems);
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
      const unsubscribe = fetchNextPageWithListener(
        productLibraryRef,
        orderBy,
        questionsPerPage,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    }

    if (numPagesToTraverse === -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = fetchPreviousPageWithListener(
        productLibraryRef,
        orderBy,
        questionsPerPage,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    }

    if (numPagesToTraverse > 1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpForwardToPageWithListener(
        productLibraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        lastDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
    }

    if (numPagesToTraverse < -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpBackwardToPageWithListener(
        productLibraryRef,
        orderBy,
        questionsPerPage,
        numPagesToTraverse,
        firstDoc,
        searchTerms,
        includeAll,
        setDisplayedQuestions
      );
      artificialDelay(500).then(() => {
        setIsFetching(false);
      });
      return unsubscribe;
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

  //==============================================================================================//
  //====================================== side effects =========================================//

  useEffect(() => {
    const unsubscribe = fetchProductLibraries();
    return unsubscribe;
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (libraryQuestions.length === 0) return;
    const updatedQuestion = libraryQuestions?.find(
      (el) => el.id === selectedQuestion?.id
    );
    setSelectedQuestion(updatedQuestion);
    //eslint-disable-next-line
  }, [libraryQuestions]);

  useEffect(() => {
    countQuestionsInLibrary(
      productLibraryInfoRef,
      productLibraryRef,
      setQuestionCount
    );
    const unsubscribe = fetchPageWithListener(
      productLibraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, [currentLibrary]);

  useEffect(() => {
    setCurrentPage(() => 1);
    countQuestionsReturnedFromQuery(
      productLibraryRef,
      searchTerms,
      includeAll,
      setQueryCount
    );
    setIsFetching(true);

    const unsubscribe = fetchPageWithListener(
      productLibraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions
    );
    artificialDelay(500).then(() => {
      setIsFetching(false);
    });
    return unsubscribe;
    // eslint-disable-next-line
  }, [searchTerms, includeAll]);

  return (
    <Box className="question-list-and-preview-area">
      <Box className="question-list-panel">
        <Box className="select-or-add-library">
          <Select
            value={libraryIndex}
            onChange={handleLibraryChange}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={-1} disabled>
              <Typography color="textSecondary">select a library</Typography>
            </MenuItem>
            {productLibraries.map((productLibrary, libIndex) => (
              <MenuItem key={libIndex} value={libIndex}>
                {productLibrary.title}
              </MenuItem>
            ))}
          </Select>
          <AddProductLibrary />
        </Box>
        <LibrarySearchModule
          currentLibrary={currentLibrary}
          includeAll={includeAll}
          searchTerms={searchTerms}
          setIncludeAll={setIncludeAll}
          setSearchTerms={setSearchTerms}
        />
        <QuestionSnippets
          currentPage={currentPage}
          deleteFrom={process.env.REACT_APP_PRODUCT_COLLECTION}
          fetchPreviousPage={fetchPreviousPageWithListener}
          isFetching={isFetching}
          productLibraryID={currentLibrary?.id}
          queryCount={queryCount}
          questions={libraryQuestions}
          searchTerms={searchTerms}
          setCurrentPage={setCurrentPage}
          setQueryCount={setQueryCount}
          setSelectedQuestion={setSelectedQuestion}
          readonly={props.readonly}
        />
        <QuestionRangeCounter
          currentPage={currentPage}
          searchTerms={searchTerms}
          queryCount={queryCount}
          questionCount={questionCount}
          questionsPerPage={questionsPerPage}
        />
        {pageCount > 0 && (
          <Box className="flex-center-all pagination-nav">
            <Pagination
              count={pageCount}
              size="small"
              page={currentPage}
              disabled={isFetching}
              onChange={handlePageChange}
            />
          </Box>
        )}
        {currentLibrary && (
          <Box className="add-library-question-buttons flex-column space-between">
            <QuestionBuilder
              saveTo={process.env.REACT_APP_PRODUCT_COLLECTION}
              productLibraryID={currentLibrary.id}
              setCurrentPage={setCurrentPage}
              setSearchTerms={setSearchTerms}
            />
            <MultipartBuilder
              libraryQuestionID={selectedQuestion?.id}
              productLibraryID={currentLibrary?.id}
              saveTo={process.env.REACT_APP_PRODUCT_COLLECTION}
            />
          </Box>
        )}
      </Box>
      <QuestionPreviewCard
        license={currentLibrary?.license}
        productLibraryID={currentLibrary?.id}
        question={selectedQuestion}
        saveTo={process.env.REACT_APP_PRODUCT_COLLECTION}
        readonly={props.readonly}
      />
    </Box>
  );
}
