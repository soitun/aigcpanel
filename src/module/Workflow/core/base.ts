import { register } from "../registry";
import DefaultEdge from "./edge/DefaultEdge";

const nodes: any = import.meta.glob("./../nodes/**/index.ts", { eager: true });
export const init = (lf: any) => {
    for (const n of Object.values(nodes)) {
        const com = (n as any).default;
        register(
            {
                type: com.type,
                component: com.component,
            },
            lf,
        );
    }
    lf.register(DefaultEdge);
    lf.setDefaultEdgeType(DefaultEdge.type);
    lf.setTheme({
        bezier: {
            stroke: "#afafaf",
            strokeWidth: 1,
        },
        // anchor: {
        //     stroke: "#ff7d00",
        //     fill: "#ffffff",
        //     r: 4,
        //     hover: {
        //         stroke: "#ff6600",
        //         fill: "#ffffff",
        //         r: 5,
        //     },
        //     active: {
        //         stroke: "#ff5500",
        //         fill: "#ffffff",
        //         r: 5,
        //     },
        // },
        anchorLine: {
            stroke: "#afafaf",
            strokeWidth: 1,
        },
        // anchorHover: {
        //     stroke: "#ff6600",
        //     fill: "#ff6600",
        //     r: 5,
        // },
    });
};
