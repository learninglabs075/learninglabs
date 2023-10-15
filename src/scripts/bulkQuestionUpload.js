/*  Writes data from a file into a firebase collection
change serviceAccount to specify firebase account
change collectionKey to specify the collection in that account
change localFile to specify the file, which is an array of objects
   [ {...},{....},..]

this is similar to :
 https://medium.com/@devesu/how-to-upload-data-to-firebase-firestore-cloud-database-63543d7b34c5#id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg0NjJhNzFkYTRmNmQ2MTFmYzBmZWNmMGZjNGJhOWMzN2Q2NWU2Y2QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2MTYwOTAyNzcsImF1ZCI6IjIxNjI5NjAzNTgzNC1rMWs2cWUwNjBzMnRwMmEyamFtNGxqZGNtczAwc3R0Zy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMzgxMzE5OTA3ODEyOTAxNzQ1MCIsImhkIjoidWNpLmVkdSIsImVtYWlsIjoicHRhYm9yZWtAdWNpLmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhenAiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJuYW1lIjoiUGV0ZXIgVGFib3JlayIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLS1wUjBvb1UzTTF3L0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y2xzX0lIWFlqb3hUejFVQUxJVWE2VDd2T0tXMVEvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlBldGVyIiwiZmFtaWx5X25hbWUiOiJUYWJvcmVrIiwiaWF0IjoxNjE2MDkwNTc3LCJleHAiOjE2MTYwOTQxNzcsImp0aSI6IjAyM2QxNmU3YmRmMzY4YWIwZjhiMjRlZjlmZmVmNWEyMTJiNDliMWIifQ.JnrvB4ZHqDfTFIqtA1ml3OMdzq9J-IxkCRQ0UbUhh-qa4CkMs2qPfuijifUfjZDg1jNkRTjz7bJdGu6LJEKk_JIoDf_nwcwYshZsLA67-Fy6Aq5BuQgeBxkfMMyQV4czZN-GNiekwR2y9hT8_a9R0cN71vDccx1UK78XWe6nWxeoPsF7i9HKcgT4RtcRY6YEWw5t7CY-TSWM8KWNQsMlSl5myuXVxTxk78zkAoPv7fv7uvs7GV-QOxx-X0Iy8TNCf7RfLJehdWMEHBDn0EVf9mVqhOZPjdYO00cPP7oXGqtXoc4q6U4xvVb5VJ-dEnysWuV6_P25xqX0lQptItntNw

*/

const admin = require("firebase-admin");
//const serviceAccount = require("./practicejunkserviceAccountKey.json");
//const localFile="./somedata.json";
const serviceAccount = require("./koralFirebaseKey.json");

const collectionKey = process.env.REACT_APP_PRODUCT_COLLECTION; //name of the collection
const doc1 = "LbBMCcpJBUZFTFenRWgy";

const collection2 = "questions";
const localFile = "./test1.json";
const data = require("./test1.json");

//const collectionKey = "randomcrap"; //name of the collection

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();
const db = admin.firestore();
// console.log(`here  ${firestore}`);
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

const Nrecords = data.length;
console.log("number of records = ", Nrecords);

async function writeTodb(db) {
  for (let i = 0; i < Nrecords; i++) {
    console.log(data[i]);
    console.log(data[i].tags);
    // string in doc( sting ) is the document name;  if blank doc() it autogenerates
    const docRef = db
      .collection(collectionKey)
      .doc(doc1)
      .collection(collection2)
      .doc();
    await docRef.set(data[i]);
  }
}

writeTodb(db);
