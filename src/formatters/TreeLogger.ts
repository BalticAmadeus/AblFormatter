import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatter } from "./IAblFormatter";
import { AAblFormatter } from "./AAblFormatter";
import { MyRange } from "../model/MyRange";

export class TreeLogger extends AAblFormatter implements IAblFormatter {
    parseNode(node: SyntaxNode): void {
        console.log(
            node.id,
            " \t ",
            node.parent?.id,
            " \t ",
            node.type,
            " \t ",
            this.ablFormatterRunner?.getDocument().getText(new MyRange(node))
        );
    }
    getSourceChanges(): SourceChanges {
        return {
            textEdits: [],
        };
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
