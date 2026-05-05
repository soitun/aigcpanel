import { WorkflowData } from "../core/type";

// @ts-ignore
export const WorkflowDemoAll: WorkflowData = {
    status: "idle",
    nodes: [
        {
            id: "start",
            type: "Start",
            x: 100,
            y: 100,
            properties: {
                width: 240,
                height: 40,
                title: "开始",
                icon: "",
                outputs: [
                    {
                        id: "output_default",
                        type: "any",
                    },
                ],
                inputFields: [],
                outputFields: [],
                status: "idle",
            },
        },
        {
            id: "test1",
            type: "FunctionCall",
            x: 420,
            y: 100,
            properties: {
                width: 240,
                height: 200,
                title: "声音替换",
                icon: "",
                inputs: [
                    {
                        id: "input_default",
                        type: "any",
                    },
                ],
                outputs: [
                    {
                        id: "output_default",
                        type: "any",
                    },
                ],
                inputFields: [
                    {
                        type: "text",
                        name: "文本",
                        defaultValue: "",
                        placeholder: "请输入文本",
                        value: "",
                    },
                    {
                        type: "file",
                        name: "音频文件",
                        defaultValue: "",
                        placeholder: "请上传音频文件",
                        value: "",
                        fileExtensions: ["mp3", "wav"],
                    },
                    {
                        type: "select",
                        name: "选项",
                        defaultValue: "",
                        placeholder: "请选择一个选项",
                        value: "",
                        selectOptions: ["选项1", "选项2", "选项3"],
                    },
                ],
                outputFields: [
                    {
                        type: "text",
                        name: "文本",
                        defaultValue: "",
                        placeholder: "请输入文本",
                        value: "",
                    },
                    {
                        type: "file",
                        name: "音频文件",
                        defaultValue: "",
                        placeholder: "请上传音频文件",
                        value: "",
                        fileExtensions: ["mp3", "wav"],
                    },
                    {
                        type: "select",
                        name: "选项",
                        defaultValue: "",
                        placeholder: "请选择一个选项",
                        value: "",
                        selectOptions: ["选项1", "选项2", "选项3"],
                    },
                ],
                status: "idle",
                functionCallName: "SoundReplace",
                data: {},
            },
        },
    ],
    edges: [
        {
            id: "start-test1",
            type: "bezier",
            sourceNodeId: "start",
            sourceAnchorId: "output_default",
            targetNodeId: "test1",
            targetAnchorId: "input_default",
        },
    ],
};
