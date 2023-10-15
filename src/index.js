import React from "react";
import ReactDOM from "react-dom";
import App from "./app/App.jsx";
import "katex/dist/katex.min.css";
import "./css/suneditor.css";
import "./css/styles.css";

  require("./css/styles-koral.css");


const rootElement = document.getElementById("root");

ReactDOM.render(<App />, rootElement);
