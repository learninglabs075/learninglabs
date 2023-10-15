import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  InputAdornment,
  IconButton,
  TextField,
  Checkbox,
  Typography,
  Chip,
  makeStyles,
} from "@material-ui/core";
import { Search } from "@material-ui/icons";

const TagsStyling = makeStyles((theme) => ({
  existingTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },
}));

export default function LibrarySearchModule({
  currentLibrary,
  includeAll,
  searchTerms,
  setIncludeAll,
  setSearchTerms,
}) {
  const classes = TagsStyling();
  const [newSearchTerm, setNewSearchTerm] = useState("");
  const [mouseOverSuggestion, setMouseOverSuggestion] = useState(false);
  const tags = currentLibrary?.tags;
  const [suggestedTags, setSuggestedTags] = useState(tags);

  function filterTags(searchPhrase) {
    const filteredTags = tags?.filter(
      (tag) =>
        tag.substring(0, searchPhrase.length).trim().toLowerCase() ===
        searchPhrase.trim().toLowerCase()
    );
    if (searchPhrase?.length > 0) return filteredTags;

    return tags;
  }

  const handleSearchFieldChange = (event) => {
    setNewSearchTerm(() => event.target.value);
    setSuggestedTags(() => filterTags(event.target.value));
  };

  const toggleAndFilter = (event) => {
    setIncludeAll(() => event.target.checked);
  };

  function addSearchTerm(event) {
    switch (newSearchTerm !== "") {
      case true:
        if (event.keyCode === 13 || event.type === "click") {
          setSearchTerms([...searchTerms, newSearchTerm]);
          setNewSearchTerm("");
          setSuggestedTags([]);
          setMouseOverSuggestion(false);
        }
        break;
      default:
        break;
    }
  }

  function addSuggestedTag(e, tag) {
    console.log(e.target.id);
    setSearchTerms([...searchTerms, tag]);
    setNewSearchTerm("");
    setSuggestedTags([]);
    setMouseOverSuggestion(false);
  }

  function deleteSearchTerm(index, searchTerms, setSearchTerms, setIncludeAll) {
    if (searchTerms?.length === 2) {
      setIncludeAll(false);
    }
    const newSearchTerms = searchTerms.slice();
    newSearchTerms.splice(index, 1);
    setSearchTerms(() => newSearchTerms);
  }

  const handleBlur = (event) => {
    if (!mouseOverSuggestion) setSuggestedTags([]);
  };

  return (
    <>
      <Box className={classes.existingTagsContainer}>
        {searchTerms?.length > 0 &&
          searchTerms.map((searchTerm, index) => (
            <Chip
              key={`searchTerm${index}`}
              label={searchTerms[index]}
              color="primary"
              onDelete={() => {
                deleteSearchTerm(
                  index,
                  searchTerms,
                  setSearchTerms,
                  setIncludeAll
                );
              }}
            />
          ))}
        {searchTerms?.length > 1 && (
          <Box
            className="flex row justify-end align-center grow"
            style={{ position: "relative", bottom: "5px" }}
          >
            <Checkbox
              name="includeAll"
              color="primary"
              onChange={toggleAndFilter}
              checked={includeAll}
            />
            <Typography>must include all</Typography>
          </Box>
        )}
      </Box>
      <Box className="search-library relative">
        <TextField
          variant="outlined"
          value={newSearchTerm}
          fullWidth
          onBlur={(e) => handleBlur(e)}
          onChange={handleSearchFieldChange}
          onKeyDown={(e) => addSearchTerm(e)}
          placeholder="topic"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label="search for a question"
                  edge="end"
                  onClick={(e) => addSearchTerm(e)}
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {suggestedTags?.length > 0 && (
          <Box
            className="absolute overflow-auto"
            style={{
              width: "100%",
              backgroundColor: "rgba(221,193,187,0.85)",
              maxHeight: "500px",
              zIndex: 20,
            }}
          >
            <List>
              {suggestedTags?.map((suggestedTag) => (
                <ListItem
                  id={suggestedTag}
                  key={suggestedTag}
                  button
                  onClick={(e) => addSuggestedTag(e, suggestedTag)}
                  onMouseOver={(e) => setMouseOverSuggestion(true)}
                  onMouseOut={(e) => setMouseOverSuggestion(false)}
                >
                  <Typography> {suggestedTag}</Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </>
  );
}
