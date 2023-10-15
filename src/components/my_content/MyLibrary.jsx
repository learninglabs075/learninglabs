import React, { useState, useEffect } from "react";
import { Box } from "@material-ui/core";
import { Pagination } from "@material-ui/lab";
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
  monitorQuestionCount,
  QuestionRangeCounter,
} from "./libraryPaginationUtils.js";
import LibrarySearchModule from "./LibrarySearchModule.jsx";

export default function MyLibrary({ userID }) {
  const [myLibraryQuestions, setMyLibraryQuestions] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState({});
  const [lastDoc, setLastDoc] = useState({});
  const [searchTerms, setSearchTerms] = useState([]);
  const [includeAll, setIncludeAll] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const orderBy = "created";
  const questionsPerPage = 10;
  const pageCount =
    searchTerms.length > 0
      ? Math.ceil(queryCount / questionsPerPage)
      : Math.ceil(questionCount / questionsPerPage);

  //==============================================================================================//
  //================================== Firestore references ======================================//

  const myLibraryInfoRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID);

  const myLibraryRef = myLibraryInfoRef.collection("my_library");

  //==============================================================================================//
  //======================================= Page Navigation ======================================//

  const handlePageChange = (event, selectedPage) => {
    const numPagesToTraverse = selectedPage - currentPage;

    setIsFetching(true);

    if (numPagesToTraverse === 1) {
      setCurrentPage(selectedPage);
      const unsubscribe = fetchNextPageWithListener(
        myLibraryRef,
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
    } else if (numPagesToTraverse === -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = fetchPreviousPageWithListener(
        myLibraryRef,
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
    } else if (numPagesToTraverse > 1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpForwardToPageWithListener(
        myLibraryRef,
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
    } else if (numPagesToTraverse < -1) {
      setCurrentPage(selectedPage);
      const unsubscribe = jumpBackwardToPageWithListener(
        myLibraryRef,
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
    setMyLibraryQuestions(() => fetchedItems);
    setFirstDoc((prev) => fetchedItems[0]);
    setLastDoc((prev) => fetchedItems[fetchedItems.length - 1]);
  }

  //==============================================================================================//
  //====================================== side effects =========================================//

  useEffect(() => {
    if (myLibraryQuestions.length === 0) return;
    const updatedQuestion = myLibraryQuestions?.find(
      (el) => el.id === selectedQuestion?.id
    );
    setSelectedQuestion(updatedQuestion);
    //eslint-disable-next-line
  }, [myLibraryQuestions]);

  useEffect(() => {
    countQuestionsInLibrary(myLibraryInfoRef, myLibraryRef, setQuestionCount);
    const unsubscribe = fetchPageWithListener(
      myLibraryRef,
      orderBy,
      questionsPerPage,
      searchTerms,
      includeAll,
      setDisplayedQuestions
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = monitorQuestionCount(
      myLibraryInfoRef,
      setQuestionCount
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setCurrentPage(() => 1);

    countQuestionsReturnedFromQuery(
      myLibraryRef,
      searchTerms,
      includeAll,
      setQueryCount
    );
    setIsFetching(true);

    const unsubscribe = fetchPageWithListener(
      myLibraryRef,
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

  //=========================================================================================================//
  //======================================== main component =================================================//

  // Note: An onsnapshot listener is attached to all displayed questions. Upon saving a new question to firestore using
  // Question Builder,  a fetch call is automatically trigerred (to retrieve the newly added question.)
  // This behavior causes issues when the user has entered search terms because the fetched questions may or may not
  // be tagged with the search terms To circumvent this issue, the current implementation clears the search terms and
  // returns the user to the unfiltered myLibrary view.

  return (
    <Box className="question-list-and-preview-area">
      <Box className="question-list-panel">
        <LibrarySearchModule
          searchTerms={searchTerms}
          setSearchTerms={setSearchTerms}
          includeAll={includeAll}
          setIncludeAll={setIncludeAll}
        />
        <QuestionSnippets
          currentPage={currentPage}
          deleteFrom="my_library"
          fetchPreviousPage={fetchPreviousPageWithListener}
          isFetching={isFetching}
          queryCount={queryCount}
          questions={myLibraryQuestions}
          searchTerms={searchTerms}
          setCurrentPage={setCurrentPage}
          setQueryCount={setQueryCount}
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
        <Box className="add-library-question-buttons flex-column space-between">
          <QuestionBuilder
            saveTo="my_library"
            setCurrentPage={setCurrentPage}
            setSearchTerms={setSearchTerms}
            userID={userID}
          />
          <MultipartBuilder saveTo="my_library" userID={userID} />
        </Box>
      </Box>

      <QuestionPreviewCard
        question={selectedQuestion}
        saveTo="my_library"
        userID={userID}
      />
    </Box>
  );
}
