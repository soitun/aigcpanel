import LogicFlow, { BezierEdge, BezierEdgeModel } from "@logicflow/core";

class CustomEdge extends BezierEdge {}

class CustomEdgeModel extends BezierEdgeModel {
    getEdgeStyle() {
        const style = super.getEdgeStyle();
        // svg属性
        style.strokeWidth = 1;
        style.stroke = "#3838f1";
        if (this.isHovered) {
            style.strokeWidth = 1;
            style.stroke = "#e47f1d";
        }
        if (this.isSelected) {
            style.strokeWidth = 2;
            style.stroke = "#e47f1d";
        }
        return style;
    }

    /**
     * 重写此方法，使保存数据是能带上锚点数据。
     */
    getData() {
        const data = super.getData();
        data.sourceAnchorId = this.sourceAnchorId;
        data.targetAnchorId = this.targetAnchorId;
        return data;
    }

    /**
     * 给边自定义方案，使其支持基于锚点的位置更新边的路径
     */
    updatePathByAnchor() {
        // TODO
        const sourceNodeModel = this.graphModel.getNodeModelById(
            this.sourceNodeId,
        );
        const sourceAnchor = sourceNodeModel
            ?.getDefaultAnchor()
            .find((anchor) => anchor.id === this.sourceAnchorId);
        const targetNodeModel = this.graphModel.getNodeModelById(
            this.targetNodeId,
        );
        const targetAnchor = targetNodeModel
            ?.getDefaultAnchor()
            .find((anchor) => anchor.id === this.targetAnchorId);

        if (sourceAnchor) {
            const startPoint: LogicFlow.Point = {
                x: sourceAnchor?.x,
                y: sourceAnchor?.y,
            };
            this.updateStartPoint(startPoint);
        }
        if (targetAnchor) {
            const endPoint: LogicFlow.Point = {
                x: targetAnchor?.x,
                y: targetAnchor?.y,
            };
            this.updateEndPoint(endPoint);
        }
        // 这里需要将原有的pointsList设置为空，才能触发bezier的自动计算control点。
        this.pointsList = [];
        this.initPoints();
    }

    updatePath(sNext: LogicFlow.Point, ePre: LogicFlow.Point) {
        // console.log('updatePath called', {sNext, ePre});
        const start = this.startPoint;
        const end = this.endPoint;
        sNext = { x: (start.x + end.x) / 2, y: start.y };
        ePre = { x: (start.x + end.x) / 2, y: end.y };
        const diffX = end.x - start.x - 10;
        // console.log('diff', {diffX});
        if (diffX < 0) {
            const offset = Math.min(Math.abs(diffX) * 5, 500);
            sNext.x += offset;
            ePre.x -= offset;
        }
        super.updatePath(sNext, ePre);
    }
}

export default {
    type: "default-edge",
    view: CustomEdge,
    model: CustomEdgeModel,
};
