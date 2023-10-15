import React, { useEffect } from "react";
import { LinearProgress } from "@material-ui/core";
import useStorage from "../../app/hooks/firebaseStorage.js";

export default function FileUpload({
  category,
  file,
  firestoreRef,
  question,
  questions,
  setFile,
  storagePath,
  upload_key,
  setSkillUrl,
}) {
  const { url, progress } = useStorage(
    category,
    file,
    firestoreRef,
    question,
    questions,
    storagePath,
    upload_key
  );

  useEffect(() => {
    if (url) {
      setFile(null);
    }

    if (url && setSkillUrl) {
      setSkillUrl(url);
    }

    // eslint-disable-next-line
  }, [url, setFile]);

  return <LinearProgress variant="determinate" value={progress} />;
}
