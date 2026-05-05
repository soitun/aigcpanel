import { WorkflowData } from "../core/type";

export const WorkflowDemoInit: WorkflowData = {
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
    ],
    edges: [],
    viewPositionX: 0,
    viewPositionY: 0,
    viewScale: 1,
};
