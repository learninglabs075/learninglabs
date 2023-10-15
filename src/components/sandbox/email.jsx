import React from "react";
import { functions } from "../../app/config/firebaseConfig.js";

function Emailer() {
  return (
    <div className="App">
      <h2>SendGrid Transactional Email with React</h2>
      {email()}
    </div>
  );
}

function email() {
  return (
    <div>
      <hr />
      <button onClick={() => sendEmail()}>
        Send Email with Callable Function
      </button>
    </div>
  );
}
async function sendEmail() {
  const callable = functions.httpsCallable("genericEmail");
  const message = await callable({
    email: ["email@email.com"],
    course: "Math 101",
  });
  return console.log(message);
}

export default Emailer;
