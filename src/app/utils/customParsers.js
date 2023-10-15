import TeX from "@matejmazur/react-katex";
import parse from "html-react-parser";

export function parseHTMLandTeX(string) {
  return parse(string, {
    replace: (domNode) => {
      if (domNode.name === "inlinetex") {
        return <TeX>{String.raw`${domNode.children[0].data}`}</TeX>;
      } else if (domNode.name === "blocktex") {
        return <TeX block>{String.raw`${domNode.children[0].data}`}</TeX>;
      }
    },
  });
}
