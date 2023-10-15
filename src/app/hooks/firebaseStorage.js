import { useState, useEffect } from "react";
import firebase from "../../app/config/firebaseConfig";

function updateQuestions(fileInfo, question, questions) {
  const updatedQuestions = questions?.map((el) => {
    if (el.id === question.id) {
      question.solution = {
        ...fileInfo,
        uploaded: firebase.firestore.Timestamp.now(),
      };
    }
    return el;
  });
  return updatedQuestions;
}

function updateAuxFiles(fileInfo, questions, question) {
  const updatedQuestions = questions?.map((el) => {
    if (el.id === question.id) question.auxillaryFiles.push(fileInfo);
    return el;
  });
  return updatedQuestions;
}

export default function useStorage(
  category,
  file,
  firestoreRef,
  question,
  questions,
  storagePath,
  upload_key
) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const storageRef = firebase.storage().ref().child(storagePath);
    console.log("file upload in progress... ");
    console.log(category);
    storageRef.put(file).on(
      "state_changed",
      (snapshot) => {
        let percentage =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(percentage);
      },
      (err) => {
        setError(err);
      },

      async () => {
        const url = await storageRef.getDownloadURL();

        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: url,
          uploaded: firebase.firestore.Timestamp.now(),
        };

        if (category === "image" || category === "document") {
          firestoreRef.add(fileInfo);
        }

        // create firestore reference for solution file uploaded to my question sets collection
        else if (category === "solution" && questions) {
          const updatedQs = updateQuestions(fileInfo, question, questions);
          firestoreRef.update({ questions: updatedQs });
        }
        // create firestore reference for solution file uploaded to my_library or products collection
        else if (category === "solution") {
          firestoreRef.update({ solution: fileInfo });
        }
        // create firestore reference for auxillary files uploaded to my_question_sets collection
        else if (category === "auxillaryFile" && questions) {
          const updatedQs = updateAuxFiles(fileInfo, questions, question);
          firestoreRef.update({ questions: updatedQs });
        }
        // create firestore reference for auxillary files uploaded to my_library or products collection
        else if (category === "auxillaryFile") {
          firestoreRef.update({
            auxillaryFiles: firebase.firestore.FieldValue.arrayUnion(fileInfo),
          });
        } else if (category === "coursePicture") {
          firestoreRef.update({ coursePicture: fileInfo });
        } else if (category === "profilePicture") {
          firestoreRef.update({ profilePicture: fileInfo });
        } else if (category === "studentUpload") {
          firestoreRef.set(
            { files: firebase.firestore.FieldValue.arrayUnion(fileInfo) },
            { merge: true }
          );
        } else if (category === "questionSetUpload") {
          firestoreRef.set({ [upload_key]: fileInfo }, { merge: true });
        } else {
          console.log("an error occurred in /src/app/hooks/firebaseStorage.js");
        }
        setUrl(url);
      }
    );
    //eslint-disable-next-line
  }, [file]);

  return { progress, url, error };
}
