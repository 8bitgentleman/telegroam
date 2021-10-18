import {
    InputGroup,
} from "@blueprintjs/core";
import {
    PageInput,
    ConfigPage,
} from "roamjs-components";
import React, { useState } from "react";
import {
    getFirstChildTextByBlockUid,
} from "roam-client";

const ShortcodeSettingsPanel = ({
    uid,
}: {
    uid?: string;
    parentUid: string;
}) => {
    const [token] = useState(
        uid ? getFirstChildTextByBlockUid(uid) : ""
    );
    return (
        <>
            <InputGroup
                disabled
                value={token}
                onChange={() => { }}
            />

        </>
    );
};

export default ShortcodeSettingsPanel;