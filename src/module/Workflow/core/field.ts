import { t } from "../../../lang";
import { NodeFieldType } from "./type";

export const fieldAll = [
    { type: "text", label: t("文本"), color: "orangered" },
    { type: "textarea", label: t("多行文本"), color: "orangered" },
    { type: "file", label: t("文件"), color: "cyan" },
    { type: "files", label: t("多文件"), color: "cyan" },
    { type: "select", label: t("下拉选项"), color: "arcoblue" },
    { type: "json", label: t("JSON"), color: "blue" },
];

export const fieldTypeToLabel = (type: NodeFieldType) => {
    const field = fieldAll.find((f) => f.type === type);
    return field ? field.label : t("未知类型");
};

export const fieldTypeToColor = (type: NodeFieldType) => {
    const field = fieldAll.find((f) => f.type === type);
    return field ? field.color : "#909399";
};
