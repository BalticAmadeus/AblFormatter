import { TextEdit } from "vscode";
import { IAblFormatter } from "./IAblFormatter";
import { SourceChanges } from "../model/SourceChanges";
import Parser from "web-tree-sitter";
import { MyRange } from "../model/MyRange";
import { AAblFormatter } from "./AAblFormatter";

export class AblTokenFormatter extends AAblFormatter implements IAblFormatter {
    private targetIsLong = true;
    private useUppercase = true;
    private longDefine = "DEFINE";
    private shortDefine = "DEF";

    public parseNode(node: Parser.SyntaxNode): void {
        if (
            node.type === "DEFINE" ||
            node.type === "define" ||
            node.type === "DEFI" ||
            node.type === "defi" ||
            node.type === "DEF" ||
            node.type === "def"
        ) {
            const range = new MyRange(node);

            console.log(node);
            this.ranges.push(range);
        }
    }

    getSourceChanges(): SourceChanges {
        let textEdits = new Array<TextEdit>();

        this.ranges.forEach((range) => {
            const textEdit = new TextEdit(
                range,
                this.targetIsLong ? this.longDefine : this.shortDefine
            );

            textEdit.newText = this.useUppercase
                ? textEdit.newText
                : textEdit.newText.toLowerCase();

            textEdits.push(textEdit);
        });

        return {
            textEdits: textEdits,
        };
    }

    clearSourceChanges(): void {
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
