import { Button, InputGroup, Intent, Label } from "@blueprintjs/core";
import React, { useMemo, useState, useRef, useEffect } from "react";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import type { OnloadArgs } from "roamjs-components/types/native";
import { PageInput } from "roamjs-components/components/PageInput";

const HotKeyEntry = ({
  hotkey,
  value,
  order,
  keys,
  setKeys,
  extensionAPI,
  workflows,
  workflowNamesByUid,
}: {
  hotkey: string;
  value: string;
  order: number;
  keys: Record<string, string>;
  setKeys: (r: Record<string, string>) => void;
  extensionAPI: OnloadArgs["extensionAPI"];
  workflows: { uid: string }[];
  workflowNamesByUid: Record<string, string>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shortcode, setShortcode] = useState("");
  const [expandedPage, setExpandedPage] = useState("");

  useEffect(() => {
    inputRef.current.className = "rm-extensions-settings";
    inputRef.current.style.minWidth = "100%";
    inputRef.current.style.maxWidth = "100%";
  }, [inputRef]);
  return (
    <div className={"flex items-center gap-1"}>
      <Label className="flex-1">
        Shortcode
        <InputGroup
            placeholder={`Shortcode to be expanded into a full tag. Starts with ".", no spaces `}
            value={shortcode}
          onChange={() => true}
          className={"w-full"}
          inputRef={inputRef}
          intent={Intent.NONE}
        />
      </Label>
      <Label className={"flex-1"}>
        Expanded Page
        <PageInput
          value={expandedPage}
          setValue={(e:any) =>
            setExpandedPage(e)
          }
          className={"w-full"}
        />
      </Label>
      <Button
        icon={"trash"}
        style={{ width: 32, height: 32 }}
        minimal
        onClick={() => {
          const newKeys = Object.fromEntries(
            Object.entries(keys).filter((_, o) => o !== order)
          );
          setKeys(newKeys);
          extensionAPI.settings.set("hot-keys", newKeys);
        }}
      />
    </div>
  );
};

const HotKeyPanel = (extensionAPI: OnloadArgs["extensionAPI"]) => () => {
  const workflows = useMemo(
    () =>
      getCleanCustomWorkflows().sort(({ name: a }, { name: b }) =>
        a.localeCompare(b)
      ),
    []
  );
  const workflowNamesByUid = useMemo(
    () => Object.fromEntries(workflows.map((wf) => [wf.uid, wf.name])),
    []
  );
  const [keys, setKeys] = useState(
    () => extensionAPI.settings.get("hot-keys") as Record<string, string> || {}
  );
  return (
    <div
      style={{
        width: "100%",
        minWidth: 256,
      }}
    >
      {Object.entries(keys).map(([key, value], order) => {
        return (
          <HotKeyEntry
            key={order}
            hotkey={key}
            value={value}
            order={order}
            workflows={workflows}
            workflowNamesByUid={workflowNamesByUid}
            extensionAPI={extensionAPI}
            keys={keys}
            setKeys={setKeys}
          />
        );
      })}
      <Button
        text={"Add Hot Key"}
        intent={Intent.PRIMARY}
        rightIcon={"plus"}
        minimal
        style={{ marginTop: 8 }}
        onClick={async () => {
          const randomWorkflow =
            workflows[Math.floor(Math.random() * workflows.length)];
          const newKeys = Object.fromEntries(
            Object.entries(keys).concat([["control+o", randomWorkflow.uid]])
          );
          setKeys(newKeys);
          extensionAPI.settings.set("hot-keys", newKeys);
        }}
      />
    </div>
  );
};

export default HotKeyPanel;