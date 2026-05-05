import { isVue2, isVue3, createApp, h, Vue2 } from "vue-demi";
import { HtmlNode } from "@logicflow/core";
import { vueNodesMap } from "./registry";
import { isActive, connect, disconnect } from "./teleport";
import ArcoVue from "@arco-design/web-vue";
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
import timeago from "vue-timeago3";
import { zhCN } from "date-fns/locale";
import { CommonComponents } from "../../../components/common";
import { i18n, t } from "../../../lang";

export class VueNodeView extends HtmlNode {
    root?: any;
    private vm: any;

    getComponentContainer() {
        return this.root;
    }

    protected targetId() {
        return `${this.props.graphModel.flowId}:${this.props.model.id}`;
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.unmount();
    }

    setHtml(rootEl: SVGForeignObjectElement) {
        const el = document.createElement("div");
        el.className = "custom-vue-node-content";
        this.root = el;
        rootEl.appendChild(el);

        this.renderVueComponent();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    confirmUpdate(_rootEl: SVGForeignObjectElement) {
        // TODO: 如有需要，可以先通过继承的方式，自定义该节点的更新逻辑；我们后续会根据实际需求，丰富该功能
        // console.log('_rootEl', _rootEl)
    }

    protected renderVueComponent() {
        this.unmountVueComponent();
        const root = this.getComponentContainer();
        const { model, graphModel } = this.props;

        if (root) {
            const { component } = vueNodesMap[model.type];
            if (component) {
                if (isVue2) {
                    const Vue = Vue2 as any;
                    this.vm = new Vue({
                        el: root,
                        render(h: any) {
                            return h(component, {
                                node: model,
                                graph: graphModel,
                            });
                        },
                        provide() {
                            return {
                                getNode: () => model,
                                getGraph: () => graphModel,
                            };
                        },
                    });
                } else if (isVue3) {
                    if (isActive()) {
                        connect(
                            this.targetId(),
                            component,
                            root,
                            model,
                            graphModel,
                        );
                    } else {
                        this.vm = createApp({
                            render() {
                                return h(component, {
                                    node: model,
                                    graph: graphModel,
                                });
                            },
                            provide() {
                                return {
                                    getNode: () => model,
                                    getGraph: () => graphModel,
                                };
                            },
                        });
                        this.vm.use(ArcoVue);
                        this.vm.use(ArcoVueIcon);
                        this.vm.use(timeago, {
                            converterOptions: {
                                includeSeconds: false,
                            },
                            locale: zhCN,
                        });
                        this.vm.use(CommonComponents);
                        this.vm.use(i18n);
                        this.vm.config.globalProperties.$t = t as any;
                        this.vm?.mount(root);
                    }
                }
            }
        }
    }

    protected unmountVueComponent() {
        const root = this.getComponentContainer();
        if (this.vm) {
            isVue2 && this.vm.$destroy();
            isVue3 && this.vm.unmount();
            this.vm = null;
        }
        if (root) {
            root.innerHTML = "";
        }
        return root;
    }

    unmount() {
        if (isActive()) {
            disconnect(this.targetId());
        }
        this.unmountVueComponent();
    }
}

export default VueNodeView;
