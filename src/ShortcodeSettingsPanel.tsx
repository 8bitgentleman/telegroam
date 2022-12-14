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
import { PageInput } from "roamjs-components";
import { Panel } from "./util";



export const ShortcodeSettingsPanel: Panel = ({ uid }) => {
    const [nodes, setNodes] = useState(() =>
    uid
      ? getBasicTreeByParentUid(uid).map((n) => ({
          shortcode: n.text,
          uid: n.uid,
          expandedPage: n.children?.[0]?.text,
          shortcodeType: n.children?.[0]?.children[0]?.text || "text",
        }))
      : []
  );
  const [shortcode, setShortcode] = useState("");
  const [expandedPage, setExpandedPage] = useState("");
  const [shortcodeType, setShortcodeType] = useState("text");

  return (
    <>
      <div style={{ display: "flex", marginBottom: 8 }}>
        <Label className={"roamjs-telegram-config-format"}>
          Shortcode
          <InputGroup
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            style={{ flexGrow: .5, paddingRight: 8 }}
            placeholder={`Shortcode to be expanded into a full tag. Starts with ".", no spaces `}
          />
        </Label>
        <Label>
          Expanded Page
          <PageInput 
            value={expandedPage}
            setValue={(e) =>
              setExpandedPage(e)
            }
            extra={["{all}"]} 
            />
        </Label>
      </div>
      <Button
        text={"Add Tag"}
        intent={Intent.PRIMARY}
        rightIcon={"plus"}
        minimal
        style={{ marginBottom: 8 }}
        // need to catch errors in the shortcode somehow (should start with a "." and not include space)
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
            setNodes([...nodes, { shortcode, uid: valueUid, expandedPage, shortcodeType }]);
            setShortcode("");
            setExpandedPage("");
            setShortcodeType("text");
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
                <span>
                  <b>Type: </b> {n.shortcodeType  || "text"}
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

