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
            node.startIndex,
            " \t ",
            node.endIndex,
            " \t ",
            node.text,
            " \t "
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

    clearSourceChanges(): void {}

    protected getSelf(): IAblFormatter {
        return this;
    }
}
