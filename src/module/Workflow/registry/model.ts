import LogicFlow, {
    HtmlNodeModel,
    IHtmlNodeProperties,
    Model,
} from "@logicflow/core";
import { cloneDeep, isNil } from "lodash-es";

// import AnchorConfig = Model.AnchorConfig

export interface VueCustomProperties extends IHtmlNodeProperties {
    // 形状属性
    width?: number;
    height?: number;
    radius?: number;

    // 文字位置属性
    refX?: number;
    refY?: number;

    // 样式属性
    style?: LogicFlow.CommonTheme;
    textStyle?: LogicFlow.TextNodeTheme;
}

export class VueNodeModel<
    P extends VueCustomProperties = VueCustomProperties,
> extends HtmlNodeModel<P> {
    setAttributes() {
        super.setAttributes();
        const { width, height, radius } = this.properties;
        if (!isNil(width)) {
            this.width = width;
        }
        if (!isNil(height)) {
            this.height = height;
        }
        if (!isNil(radius)) {
            this.radius = radius;
        }
        // 设置锚点始终显示
        this.isShowAnchor = true;
    }

    // 重写 setHovered 方法，确保悬停时锚点仍然显示
    setHovered(flag: boolean) {
        super.setHovered(flag);
        // 无论悬停状态如何，都保持锚点显示
        this.isShowAnchor = true;
    }

    // 重写 setSelected 方法，确保选中时锚点仍然显示
    setSelected(flag: boolean) {
        super.setSelected(flag);
        // 无论选中状态如何，都保持锚点显示
        this.isShowAnchor = true;
    }

    getTextStyle(): LogicFlow.TextNodeTheme {
        const { refX = 0, refY = 0, textStyle } = this.properties;
        const style = super.getTextStyle();

        // 通过 transform 重新设置 text 的位置
        return {
            ...style,
            ...(cloneDeep(textStyle) || {}),
            transform: `matrix(1 0 0 1 ${refX} ${refY})`,
        };
    }

    getNodeStyle(): LogicFlow.CommonTheme {
        const style = super.getNodeStyle();
        const {
            style: customNodeStyle,
            // radius = 0, // 第二种方式，设置圆角
        } = this.properties;

        return {
            ...style,
            ...(cloneDeep(customNodeStyle) || {}),
            // rx: radius,
            // ry: radius,
        };
    }

    getDefaultAnchor(): Model.AnchorConfig[] {
        let {
            id,
            x,
            y,
            width,
            height,
            isHovered,
            isSelected,
            properties: { inputs, outputs, fields, isConnection },
        } = this;
        const inputArray = (inputs || []) as any[];
        const outputArray = (outputs || []) as any[];
        const anchors: any[] = [];
        inputArray.forEach((input, index) => {
            anchors.push({
                x: x - width / 2,
                y: y - height / 2 + 20 + index * 24,
                id: input.id, // `${id}_${input.id}_input`,
                type: "left",
                edgeAddable: false,
            });
        });
        outputArray.forEach((output, index) => {
            anchors.push({
                x: x + width / 2,
                y: y - height / 2 + 20 + index * 24,
                id: output.id, //`${id}_${output.id}_output`,
                type: "right",
            });
        });
        return anchors;
    }
}

export default VueNodeModel;
