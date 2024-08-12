import { SyntaxNode } from "web-tree-sitter";
import { IConfigurationManager } from "../../utils/IConfigurationManager";
import { CodeEdit } from "../model/CodeEdit";

export abstract class AFormatter {
    protected readonly configurationManager: IConfigurationManager;

    public constructor(configurationManager: IConfigurationManager) {
        this.configurationManager = configurationManager;
    }

    protected getCodeEdit(
        node: SyntaxNode,
        oldText: string,
        newText: string
    ): CodeEdit {
        const diff = newText.length - oldText.length;
        const rowDiff = newText.split("\n").length - oldText.split("\n").length;
        const lastRowColumn =
            newText.split("\n")[newText.split("\n").length - 1].length;

        return {
            text: newText,
            edit: {
                startIndex: node.startIndex,
                oldEndIndex: node.endIndex,
                startPosition: node.startPosition,
                oldEndPosition: node.endPosition,
                newEndIndex: node.endIndex + diff,
                newEndPosition: {
                    column: lastRowColumn,
                    row: node.endPosition.row + Math.max(rowDiff, 0),
                },
            },
        };
    }
}
