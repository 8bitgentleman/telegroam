import {
    Button,
    H6,
    InputGroup,
    Intent,
    Label,
} from "@blueprintjs/core";

import React, { useState } from "react";
import {
    createBlock,
    deleteBlock,
    getBasicTreeByParentUid,
    getFirstChildTextByBlockUid,
    getPageUidByPageTitle,
    getShallowTreeByParentUid,
    getTreeByBlockUid,
    TreeNode,
} from "roam-client";
import { Panel } from "./util";



export const ShortcodeSettingsPanel: Panel = ({ uid }) => {
    const [nodes, setNodes] = useState(() =>
    uid
      ? getBasicTreeByParentUid(uid).map((n) => ({
          shortcode: n.text,
          uid: n.uid,
          expandedPage: n.children?.[1]?.text,
        }))
      : []
  );
  const [shortcode, setShortcode] = useState("");
  const [expandedPage, setExpandedPage] = useState("");
  return (
    <>
      <div style={{ display: "flex", marginBottom: 8 }}>
        <Label className={"roamjs-discourse-config-format"}>
          Shortcode
          <InputGroup
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            style={{ flexGrow: .5, paddingRight: 8 }}
            placeholder={`Shortcode to be expanded into a full tag. Starts with "." `}
          />
        </Label>
        <Label>
          Expanded Page
          <InputGroup
            value={expandedPage}
            onChange={(e) =>
              setExpandedPage(e.target.value)
            }
            style={{ flexGrow: .5 }}
          />
        </Label>
      </div>
      <Button
        text={"Add Tag"}
        intent={Intent.PRIMARY}
        rightIcon={"plus"}
        minimal
        style={{ marginBottom: 8 }}
        disabled={!shortcode || !expandedPage}
        onClick={() => {
          const valueUid = createBlock({
            parentUid: uid,
            order: nodes.length,
            node: {
              text: shortcode,
              children: [ { text: expandedPage }],
            },
          });
          setTimeout(() => {
            setNodes([...nodes, { shortcode, uid: valueUid, expandedPage }]);
            setShortcode("");
            setExpandedPage("");
          }, 1);
        }}
      />
      <ul
        style={{
          listStyle: "none",
          paddingInlineStart: 0,
        }}
      >
        {nodes.map((n) => {
          return (
            <li
              key={n.uid}
              style={{ border: "1px dashed #80808080", padding: 4 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ display: "inline-block", minWidth: 200 }}>
                  <b>Shortcode: </b> {n.shortcode}
                </span>
                <span>
                  <b>Expanded Page: </b> {n.expandedPage}
                </span>
                <Button
                  icon={"trash"}
                  onClick={() => {
                    setNodes(nodes.filter((nn) => nn.uid !== n.uid));
                    deleteBlock(n.uid);
                  }}
                  style={{ minWidth: 30 }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

