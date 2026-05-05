import { EventType } from "@logicflow/core";
import { defineComponent } from "vue";
import { t } from "../../../lang";
import { ObjectUtil } from "../../../lib/util";
import NodeMoreAction from "../components/NodeMoreAction.vue";
import { NodeProperties } from "../core/type";
import { vueNodesMap } from "../registry";

export const NodeMixin = defineComponent({
    components: {
        NodeMoreAction,
    },
    inject: ["getNode", "getGraph"],
    data() {
        return {
            title: t("节点"),
            node: null as any,
            graphModel: null as any,
            properties: null as NodeProperties | null,
            icon: null as any,
            resizeObserver: null as ResizeObserver | null,
        };
    },
    methods: {
        init(option?: { icon?: string }) {
            option = Object.assign({}, option);
            this.node = (this as any).getNode();
            this.graphModel = (this as any).getGraph();
            const props = this.node?.getProperties();
            this.title = props.title || t("未知节点");
            this.icon = props.icon || option.icon || "";
            this.properties = ObjectUtil.clone(props);
            this.graphModel.eventCenter.on(
                EventType.NODE_PROPERTIES_CHANGE,
                this.watchProperties,
            );
            this.resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    // 使用requestAnimationFrame来确保DOM更新完成
                    requestAnimationFrame(() => {
                        if (!this.graphModel || !this.node) return;
                        const nodeModel = this.graphModel.nodes.find(
                            (n: any) => n.id === this.node.id,
                        );
                        if (nodeModel) {
                            nodeModel.setProperty("height", height + 2);
                            this.graphModel.edges.forEach((edge: any) => {
                                if (
                                    edge.sourceNodeId === this.node.id ||
                                    edge.targetNodeId === this.node.id
                                ) {
                                    if (edge.updatePathByAnchor) {
                                        edge.updatePathByAnchor();
                                    } else {
                                        edge.initPoints();
                                    }
                                }
                            });
                        }
                    });
                }
            });
            this.resizeObserver.observe(this.$refs.container as Element);
        },
        watchProperties(eventData: any) {
            if (eventData.id !== this.node.id) {
                return;
            }
            const content = vueNodesMap[this.node.type];
            if (content) {
                this.properties = ObjectUtil.clone(eventData.properties);
            }
        },
    },
    beforeUnmount(): any {
        this.resizeObserver?.disconnect();
        this.graphModel?.eventCenter.off(
            EventType.NODE_PROPERTIES_CHANGE,
            this.watchProperties,
        );
    },
});

export const ConfigMixin = defineComponent({
    props: {
        node: {
            type: Object,
        },
        properties: {
            type: Object as () => NodeProperties,
        },
    },
    emits: {
        updateProperties: (val: NodeProperties) => true,
    },
});
