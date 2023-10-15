import { Box, Typography } from "@material-ui/core";
import { makeSearchFriendly } from "../../app/utils/utils";

function processSnapshot(snapshot, fetchedItems) {
  snapshot.forEach((doc) => {
    fetchedItems.push({
      id: doc.id,
      ...doc.data(),
    });
  });
}

function applyAndFilter(fetchedItems, searchTerms_normalized) {
  return fetchedItems.filter((question) =>
    includesAllSearchTerms(searchTerms_normalized, question.tags_searchable)
  );
}

function includesAllSearchTerms(searchTerms, tags) {
  return searchTerms.every((term) => tags.includes(term));
}

function addOrderBy(ref, orderBy) {
  switch (orderBy) {
    case "chapterThenProblemNumber":
      return ref.orderBy("chapterThenProblemNumber", "asc");
    case "created":
      return ref.orderBy("created", "desc");
    case "topicIndex":
      return ref.orderBy("topicIndex", "asc");
    default:
      return ref.orderBy("created", "desc");
  }
}

function addStartAfter(ref, orderBy, lastDoc) {
  if (!ref) return;

  switch (orderBy) {
    case "chapterThenProblemNumber":
      return ref.startAfter(lastDoc.chapterThenProblemNumber);
    case "created":
      return ref.startAfter(lastDoc.created);
    case "topicIndex":
      return ref.startAfter(lastDoc.topicIndex);
    default:
      return ref.startAfter(lastDoc.created);
  }
}

function addEndBefore(ref, orderBy, firstDoc) {
  if (!ref) return;

  switch (orderBy) {
    case "chapterThenProblemNumber":
      return ref.endBefore(firstDoc.chapterThenProblemNumber);
    case "created":
      return ref.endBefore(firstDoc.created);
    case "topicIndex":
      return ref.endBefore(firstDoc.topicIndex); // Was this the fix???
    default:
      return ref.endBefore(firstDoc.created);
  }
}

function addQueryOrderBy(ref, searchTerms, orderBy) {
  if (searchTerms.length === 0) return;

  const searchTerms_normalized = makeSearchFriendly(searchTerms);

  switch (orderBy) {
    case "chapterThenProblemNumber":
      return ref
        .where("tags_searchable", "array-contains-any", searchTerms_normalized)
        .orderBy("chapterThenProblemNumber", "asc");
    case "created":
      return ref
        .where("tags_searchable", "array-contains-any", searchTerms_normalized)
        .orderBy("created", "desc");
    case "topicIndex":
      return ref
        .where("tags_searchable", "array-contains-any", searchTerms_normalized)
        .orderBy("topicIndex", "asc");
    default:
      return ref
        .where("tags_searchable", "array-contains-any", searchTerms_normalized)
        .orderBy("created", "desc");
  }
}

//===============================================================================================================//
//=================================== Fetch Calls - one-time get only ===========================================//

export async function fetchPage(
  libraryRef,
  orderBy,
  questionsPerPage,
  searchTerms,
  includeAll,
  setDisplayedQuestions,
  setIsFetching
) {
  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_limit = ref_orderBy.limit(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_limit = ref_query_orderBy?.limit(questionsPerPage);
  const fetchedItems = [];

  if (searchTerms.length === 0) {
    const snapshot = await ref_orderBy_limit.get();
    processSnapshot(snapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 0 && !includeAll) {
    const querySnapshot = await ref_query_orderBy_limit.get();
    processSnapshot(querySnapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 1 && includeAll) {
    const querySnapshot = await ref_query_orderBy.get();
    processSnapshot(querySnapshot, fetchedItems);
    const filteredQuestions = applyAndFilter(
      fetchedItems,
      makeSearchFriendly(searchTerms)
    );
    setDisplayedQuestions(filteredQuestions.slice(0, questionsPerPage));
  }
  setIsFetching(false);
}

export async function fetchNextPage(
  libraryRef,
  orderBy,
  questionsPerPage,
  lastDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions,
  setIsFetching
) {
  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_startAfter = addStartAfter(ref_orderBy, orderBy, lastDoc);
  const ref_orderBy_startAfter_limit =
    ref_orderBy_startAfter.limit(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_startAfter = addStartAfter(
    ref_query_orderBy,
    orderBy,
    lastDoc
  );
  const libraryRef_query_orderBy_startAfter_limit =
    ref_query_orderBy_startAfter?.limit(questionsPerPage);
  const fetchedItems = [];

  if (searchTerms.length === 0) {
    const snapshot = await ref_orderBy_startAfter_limit.get();
    processSnapshot(snapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 0 && !includeAll) {
    const querySnapshot = await libraryRef_query_orderBy_startAfter_limit.get();
    processSnapshot(querySnapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 1 && includeAll) {
    const querySnapshot = await ref_query_orderBy_startAfter.get();
    processSnapshot(querySnapshot, fetchedItems);
    const filteredQuestions = applyAndFilter(
      fetchedItems,
      makeSearchFriendly(searchTerms)
    );
    setDisplayedQuestions(filteredQuestions.slice(0, questionsPerPage));
  }
  setIsFetching(false);
}

export async function fetchPreviousPage(
  libraryRef,
  orderBy,
  questionsPerPage,
  firstDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions,
  setIsFetching
) {
  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_endBefore = addEndBefore(ref_orderBy, orderBy, firstDoc);
  const ref_orderBy_endBefore_limitToLast =
    ref_orderBy_endBefore.limitToLast(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_endBefore = addEndBefore(
    ref_query_orderBy,
    orderBy,
    firstDoc
  );
  const ref_query_orderBy_endBefore_limitToLast =
    ref_query_orderBy_endBefore?.limitToLast(questionsPerPage);
  const fetchedItems = [];

  if (searchTerms.length === 0) {
    const snapshot = await ref_orderBy_endBefore_limitToLast.get();
    processSnapshot(snapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 0 && !includeAll) {
    const querySnapshot = await ref_query_orderBy_endBefore_limitToLast.get();
    processSnapshot(querySnapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems);
  } else if (searchTerms.length > 1 && includeAll) {
    const querySnapshot = await ref_query_orderBy_endBefore.get();
    processSnapshot(querySnapshot, fetchedItems);
    const filteredQuestions = applyAndFilter(
      fetchedItems,
      makeSearchFriendly(searchTerms)
    );
    setDisplayedQuestions(
      filteredQuestions.slice(
        filteredQuestions.length - questionsPerPage,
        filteredQuestions.length
      )
    );
  }
  setIsFetching(false);
}

export async function jumpForwardToPage(
  libraryRef,
  orderBy,
  questionsPerPage,
  numPagesToTraverse,
  lastDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions,
  setIsFetching
) {
  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_startAfter = addStartAfter(ref_orderBy, orderBy, lastDoc);
  const ref_orderBy_startAfter_limit = ref_orderBy_startAfter?.limit(
    numPagesToTraverse * questionsPerPage
  );
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_startAfter = addStartAfter(
    ref_query_orderBy,
    orderBy,
    lastDoc
  );
  const ref_query_orderBy_startAfter_limit =
    ref_query_orderBy_startAfter?.limit(numPagesToTraverse * questionsPerPage);
  const fetchedItems = [];

  if (searchTerms.length === 0) {
    const snapshot = await ref_orderBy_startAfter_limit.get();
    processSnapshot(snapshot, fetchedItems);
    setDisplayedQuestions(
      fetchedItems.slice(
        (numPagesToTraverse - 1) * questionsPerPage,
        numPagesToTraverse * questionsPerPage
      )
    );
  } else if (searchTerms.length > 0 && !includeAll) {
    const querySnapshot = await ref_query_orderBy_startAfter_limit.get();
    processSnapshot(querySnapshot, fetchedItems);
    setDisplayedQuestions(
      fetchedItems.slice(
        (numPagesToTraverse - 1) * questionsPerPage,
        numPagesToTraverse * questionsPerPage
      )
    );
  } else if (searchTerms.length > 1 && includeAll) {
    const querySnapshot = await ref_query_orderBy_startAfter.get();
    processSnapshot(querySnapshot, fetchedItems);
    const filteredQuestions = applyAndFilter(
      fetchedItems,
      makeSearchFriendly(searchTerms)
    );
    setDisplayedQuestions(
      filteredQuestions.slice(
        (numPagesToTraverse - 1) * questionsPerPage,
        numPagesToTraverse * questionsPerPage
      )
    );
  }
  setIsFetching(false);
}

export async function jumpBackwardToPage(
  libraryRef,
  orderBy,
  questionsPerPage,
  numPagesToTraverse,
  firstDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions,
  setIsFetching
) {
  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_endBefore = addEndBefore(ref_orderBy, orderBy, firstDoc);
  const ref_orderBy_endBefore_limitToLast = ref_orderBy_endBefore?.limitToLast(
    Math.abs(numPagesToTraverse) * questionsPerPage
  );

  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_endBefore = addEndBefore(
    ref_query_orderBy,
    orderBy,
    firstDoc
  );
  const ref_query_orderBy_endBefore_limitToLast =
    ref_query_orderBy_endBefore?.limitToLast(
      Math.abs(numPagesToTraverse) * questionsPerPage
    );
  const fetchedItems = [];

  if (searchTerms.length === 0) {
    const snapshot = await ref_orderBy_endBefore_limitToLast.get();
    processSnapshot(snapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems.slice(0, questionsPerPage));
  } else if (searchTerms.length > 0 && !includeAll) {
    const querySnapshot = await ref_query_orderBy_endBefore_limitToLast.get();
    processSnapshot(querySnapshot, fetchedItems);
    setDisplayedQuestions(fetchedItems.slice(0, questionsPerPage));
  } else if (searchTerms.length > 1 && includeAll) {
    const querySnapshot = await ref_query_orderBy_endBefore.get();
    processSnapshot(querySnapshot, fetchedItems);
    const filteredQuestions = applyAndFilter(
      fetchedItems,
      makeSearchFriendly(searchTerms)
    );
    //Check for correctness, check if numPagesToTraverse is a negative number
    setDisplayedQuestions(
      filteredQuestions.slice(
        numPagesToTraverse * questionsPerPage,
        (numPagesToTraverse + 1) * questionsPerPage
      )
    );
  }
  setIsFetching(false);
}

//===============================================================================================================//
//=================================== Fetch Calls - with onSnapshot Listeners ===================================//

export function fetchPageWithListener(
  libraryRef,
  orderBy,
  questionsPerPage,
  searchTerms,
  includeAll,
  setDisplayedQuestions
) {
  //================ declare Firestore references =================//

  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_limit = ref_orderBy.limit(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_limit = ref_query_orderBy?.limit(questionsPerPage);

  //====================== take snapshot ==========================//

  if (searchTerms.length === 0) {
    ref_orderBy_limit.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
  } else if (searchTerms.length > 0 && !includeAll) {
    ref_query_orderBy_limit.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
  } else if (searchTerms.length > 1 && includeAll) {
    ref_query_orderBy.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      const filteredQuestions = applyAndFilter(
        fetchedItems,
        makeSearchFriendly(searchTerms)
      );
      setDisplayedQuestions(filteredQuestions.slice(0, questionsPerPage));
    });
  }
}

export function fetchNextPageWithListener(
  libraryRef,
  orderBy,
  questionsPerPage,
  lastDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions
) {
  //================ declare Firestore references =================//

  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_startAfter = addStartAfter(ref_orderBy, orderBy, lastDoc);
  const ref_orderBy_startAfter_limit =
    ref_orderBy_startAfter.limit(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_startAfter = addStartAfter(
    ref_query_orderBy,
    orderBy,
    lastDoc
  );
  const libraryRef_query_orderBy_startAfter_limit =
    ref_query_orderBy_startAfter?.limit(questionsPerPage);

  //====================== take snapshot ==========================//

  if (searchTerms.length === 0) {
    ref_orderBy_startAfter_limit.onSnapshot((snapshot) => {
      const fetchedItems = [];
      processSnapshot(snapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
  } else if (searchTerms.length > 0 && !includeAll) {
    libraryRef_query_orderBy_startAfter_limit.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
  } else if (searchTerms.length > 1 && includeAll) {
    ref_query_orderBy_startAfter.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      const filteredQuestions = applyAndFilter(
        fetchedItems,
        makeSearchFriendly(searchTerms)
      );
      setDisplayedQuestions(filteredQuestions.slice(0, questionsPerPage));
    });
  }
}

export function fetchPreviousPageWithListener(
  libraryRef,
  orderBy,
  questionsPerPage,
  firstDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions
) {
  //================ declare Firestore references =================//

  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_endBefore = addEndBefore(ref_orderBy, orderBy, firstDoc);
  const ref_orderBy_endBefore_limitToLast =
    ref_orderBy_endBefore.limitToLast(questionsPerPage);
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_endBefore = addEndBefore(
    ref_query_orderBy,
    orderBy,
    firstDoc
  );
  const ref_query_orderBy_endBefore_limitToLast =
    ref_query_orderBy_endBefore?.limitToLast(questionsPerPage);

  //====================== take snapshot ==========================//

  if (searchTerms.length === 0) {
    ref_orderBy_endBefore_limitToLast.onSnapshot((snapshot) => {
      const fetchedItems = [];
      processSnapshot(snapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
    return;
  }

  if (searchTerms.length > 0 && !includeAll) {
    ref_query_orderBy_endBefore_limitToLast.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
    return;
  }

  if (searchTerms.length > 1 && includeAll) {
    ref_query_orderBy_endBefore.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      const filteredQuestions = applyAndFilter(
        fetchedItems,
        makeSearchFriendly(searchTerms)
      );
      setDisplayedQuestions(
        filteredQuestions.slice(
          filteredQuestions.length - questionsPerPage,
          filteredQuestions.length
        )
      );
    });
    return;
  }
}

export async function jumpForwardToPageWithListener(
  libraryRef,
  orderBy,
  questionsPerPage,
  numPagesToTraverse,
  lastDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions
) {
  //================ declare Firestore references =================//

  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_startAfter = addStartAfter(ref_orderBy, orderBy, lastDoc);
  const ref_orderBy_startAfter_limit = ref_orderBy_startAfter?.limit(
    (numPagesToTraverse - 1) * questionsPerPage
  );
  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_startAfter = addStartAfter(
    ref_query_orderBy,
    orderBy,
    lastDoc
  );
  const ref_query_orderBy_startAfter_limit =
    ref_query_orderBy_startAfter?.limit(
      (numPagesToTraverse - 1) * questionsPerPage
    );

  //====================== take snapshot ==========================//

  if (searchTerms.length === 0) {
    //fetches documents up to but not including selected page
    const snapshot = await ref_orderBy_startAfter_limit.get();
    const newLastDoc = snapshot.docs[snapshot.size - 1].data();
    //fetches selected page with onSnapshot listener
    const ref_orderBy_newStartAfter = addStartAfter(
      ref_orderBy,
      orderBy,
      newLastDoc
    );
    ref_orderBy_newStartAfter.limit(questionsPerPage).onSnapshot((snapshot) => {
      const fetchedItems = [];
      processSnapshot(snapshot, fetchedItems);
      setDisplayedQuestions(fetchedItems);
    });
  } else if (searchTerms.length > 0 && !includeAll) {
    //fetches documents up to but not including selected page
    const snapshot = await ref_query_orderBy_startAfter_limit.get();
    const newLastDoc = snapshot.docs[snapshot.size - 1].data();
    //fetches selected page with onSnapshot listener
    const ref_query_orderBy_newStartAfter = addStartAfter(
      ref_query_orderBy,
      orderBy,
      newLastDoc
    );
    ref_query_orderBy_newStartAfter
      .limit(questionsPerPage)
      .onSnapshot((querySnapshot) => {
        const fetchedItems = [];
        processSnapshot(querySnapshot, fetchedItems);
        setDisplayedQuestions(fetchedItems);
      });
  } else if (searchTerms.length > 1 && includeAll) {
    ref_query_orderBy_startAfter.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      const filteredQuestions = applyAndFilter(
        fetchedItems,
        makeSearchFriendly(searchTerms)
      );
      setDisplayedQuestions(
        filteredQuestions.slice(
          (numPagesToTraverse - 1) * questionsPerPage,
          numPagesToTraverse * questionsPerPage
        )
      );
    });
  }
}

export async function jumpBackwardToPageWithListener(
  libraryRef,
  orderBy,
  questionsPerPage,
  numPagesToTraverse,
  firstDoc,
  searchTerms,
  includeAll,
  setDisplayedQuestions
) {
  //================ declare Firestore references =================//

  const ref_orderBy = addOrderBy(libraryRef, orderBy);
  const ref_orderBy_endBefore = addEndBefore(ref_orderBy, orderBy, firstDoc);
  const ref_orderBy_endBefore_limitToLast = ref_orderBy_endBefore?.limitToLast(
    (Math.abs(numPagesToTraverse) - 1) * questionsPerPage
  );

  const ref_query_orderBy = addQueryOrderBy(libraryRef, searchTerms, orderBy);
  const ref_query_orderBy_endBefore = addEndBefore(
    ref_query_orderBy,
    orderBy,
    firstDoc
  );
  const ref_query_orderBy_endBefore_limitToLast =
    ref_query_orderBy_endBefore?.limitToLast(
      (Math.abs(numPagesToTraverse) - 1) * questionsPerPage
    );

  //====================== take snapshot ==========================//

  if (searchTerms.length === 0) {
    //fetches documents up to but not including selected page
    const snapshot = await ref_orderBy_endBefore_limitToLast.get();
    const newFirstDoc = snapshot.docs[0].data();
    //fetches selected page with onSnapshot listener
    const ref_orderBy_newFirstDoc = addEndBefore(
      ref_orderBy,
      orderBy,
      newFirstDoc
    );
    ref_orderBy_newFirstDoc
      .limitToLast(questionsPerPage)
      .onSnapshot((snapshot) => {
        const fetchedItems = [];
        processSnapshot(snapshot, fetchedItems);
        setDisplayedQuestions(fetchedItems);
      });
  } else if (searchTerms.length > 0 && !includeAll) {
    //fetches documents up to but not including selected page
    const snapshot = await ref_query_orderBy_endBefore_limitToLast.get();
    const newFirstDoc = snapshot.docs[0].data();
    const ref_query_orderBy_newEndBefore = addEndBefore(
      ref_query_orderBy,
      orderBy,
      newFirstDoc
    );
    //fetches selected page with onSnapshot listener
    ref_query_orderBy_newEndBefore
      .limitToLast(questionsPerPage)
      .onSnapshot((querySnapshot) => {
        const fetchedItems = [];
        processSnapshot(querySnapshot, fetchedItems);
        setDisplayedQuestions(fetchedItems);
      });
  } else if (searchTerms.length > 1 && includeAll) {
    ref_query_orderBy_endBefore.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      processSnapshot(querySnapshot, fetchedItems);
      const filteredQuestions = applyAndFilter(
        fetchedItems,
        makeSearchFriendly(searchTerms)
      );
      //CHECK IF CORRECT
      setDisplayedQuestions(
        filteredQuestions.slice(
          numPagesToTraverse * questionsPerPage,
          (numPagesToTraverse + 1) * questionsPerPage
        )
      );
    });
  }
}

//================================================================================================//
//===================================== Question Counters ========================================//

export async function countQuestionsInLibrary(
  libraryInfoRef,
  libraryRef,
  setQuestionCount
) {
  // check first if count of my_library questions exists. If so, set as questionCount
  await libraryInfoRef.get().then(async (docRef) => {
    if (docRef.exists && typeof docRef.data().questionCount === "number") {
      setQuestionCount(docRef.data().questionCount);
      return;
    } else if (docRef.exists) {
      // otherwise, read the entire collection and set number of returned docs as questionCount
      const librarySnapshot = await libraryRef.get();
      await libraryInfoRef.update({
        questionCount: librarySnapshot.size,
      });
      setQuestionCount(librarySnapshot.size);
      return;
    } else return;
  });
}

export function monitorQuestionCount(libraryInfoRef, setQuestionCount) {
  libraryInfoRef.onSnapshot((doc) => {
    if (doc.exists) {
      setQuestionCount(doc.data().questionCount);
    }
  });
}

export async function countQuestionsReturnedFromQuery(
  myLibraryRef,
  searchTerms,
  includeAll,
  setQueryCount
) {
  const searchTerms_normalized = makeSearchFriendly(searchTerms);
  if (searchTerms.length > 0 && !includeAll) {
    const snapshot = await myLibraryRef
      .where("tags_searchable", "array-contains-any", searchTerms_normalized)
      .get();
    setQueryCount(snapshot.size);
  } else if (searchTerms.length > 1 && includeAll) {
    const fetchedItems = [];
    const snapshot = await myLibraryRef
      .where("tags_searchable", "array-contains-any", searchTerms_normalized)
      .get();

    snapshot.forEach((doc) => fetchedItems.push(doc.data()));

    const filteredQuestions = fetchedItems.filter((question) =>
      includesAllSearchTerms(searchTerms_normalized, question.tags_searchable)
    );
    setQueryCount(filteredQuestions.length);
  } else {
    setQueryCount(0);
  }
}

//==============================================================================================//
//=================================== handle user actions ======================================//

export function addSearchTerm(
  event,
  currentSearchTerm,
  searchTerms,
  setCurrentSearchTerm,
  setSearchTerms
) {
  switch (currentSearchTerm !== "") {
    case true:
      if (event.keyCode === 13 || event.type === "click") {
        setSearchTerms([...searchTerms, currentSearchTerm]);
        setCurrentSearchTerm("");
      }
      break;
    default:
      break;
  }
}

export function deleteSearchTerm(
  index,
  searchTerms,
  setSearchTerms,
  setIncludeAll
) {
  if (searchTerms.length === 2) {
    setIncludeAll(false);
  }
  const newSearchTerms = searchTerms.slice();
  newSearchTerms.splice(index, 1);
  setSearchTerms(() => newSearchTerms);
}

//=================================================================================================//
//=================================== question range counter ======================================//

export function displayQuestionRange(
  numberOfQuestionsPerPage,
  page,
  totalNumberQuestions
) {
  if (totalNumberQuestions === 0) return <span>no questions found</span>;
  if (totalNumberQuestions > 0)
    return (
      <span>
        {numberOfQuestionsPerPage * (page - 1) + 1} -{" "}
        {numberOfQuestionsPerPage * page > totalNumberQuestions
          ? totalNumberQuestions
          : numberOfQuestionsPerPage * page}
        {" of "}
        {totalNumberQuestions} results
      </span>
    );
}

export function QuestionRangeCounter({
  searchTerms,
  questionsPerPage,
  currentPage,
  queryCount,
  questionCount,
}) {
  return (
    <Box className="full-width padding-vertical-tiny question-range-counter">
      <Typography color="textSecondary" style={{ textAlign: "center" }}>
        {searchTerms.length > 0
          ? displayQuestionRange(questionsPerPage, currentPage, queryCount)
          : displayQuestionRange(questionsPerPage, currentPage, questionCount)}
      </Typography>
    </Box>
  );
}
