import { EventType } from "@logicflow/core";
import { defineComponent } from "vue";
import { t } from "../../../lang";
import { ObjectUtil } from "../../../lib/util";
import NodeMoreAction from "../components/NodeMoreAction.vue";
import { getGraphModel, setNodeHeightById } from "../core/global";
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
            properties: null as NodeProperties | null,
            icon: null as any,
            resizeObserver: null as ResizeObserver | null,
        };
    },
    methods: {
        init(option?: { icon?: string }) {
            option = Object.assign({}, option);
            this.node = (this as any).getNode();
            const props = this.node?.getProperties();
            this.title = props.title || t("未知节点");
            this.icon = props.icon || option.icon || "";
            this.properties = ObjectUtil.clone(props);
            getGraphModel().eventCenter.on(
                EventType.NODE_PROPERTIES_CHANGE,
                this.watchProperties,
            );
            this.resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    // 使用requestAnimationFrame来确保DOM更新完成
                    requestAnimationFrame(() => {
                        setNodeHeightById(this.node.id, height + 2);
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
        getGraphModel().eventCenter.off(
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
