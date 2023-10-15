import React, { useRef } from "react";
import SunEditor from "suneditor-react";

// const handleEditorChange = (editorContent) => {
//   console.log(editorContent); //Get Content Inside Editor
// };

const MyComponent = (props) => {
  const editorRef = useRef();

  return (
    <div>
      {/* <SunEditor ref={editorRef} onChange={handleEditorChange} /> */}
      <SunEditor
        placeholder="hello"
        ref={editorRef}
        onChange={(editorContent) => console.log(editorContent)}
      />
      <button
        onClick={() => console.log(editorRef.current.editor.getContents())}
      >
        see Editor contents in console
      </button>
      <button onClick={() => console.log(editorRef.current.editor)}>
        See editor in console
      </button>
    </div>
  );
};
export default MyComponent;
