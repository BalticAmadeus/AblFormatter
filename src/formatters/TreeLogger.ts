import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatter } from "./IAblFormatter";
import { AAblFormatter } from "./AAblFormatter";
import { MyRange } from "../model/MyRange";

export class TreeLogger extends AAblFormatter implements IAblFormatter {
    private errorCounter: number = 0;

    parseNode(node: SyntaxNode): void {
        if (node.type === "ERROR") {
            this.errorCounter++;
        }
        console.log(
            node.id,
            " \t ",
            node.parent?.id,
            " \t ",
            node.type,
            " \t ",
            this.ablFormatterRunner?.getDocument().getText(new MyRange(node))
            // " \t ",
            // node.text
        );
    }
    getSourceChanges(): SourceChanges {
        console.log("Number of parser errrors: " + this.errorCounter);
        return {
            textEdits: [],
        };
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
