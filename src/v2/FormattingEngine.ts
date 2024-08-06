import { TextDocument } from "vscode";
import { Edit, SyntaxNode, Tree } from "web-tree-sitter";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { IFormatter } from "./IFormatter";
import { BlockFormater } from "./BlockFormatter";

export class FormattingEngine {
    constructor(
        private parserHelper: IParserHelper,
        private fileIdentifier: FileIdentifier,
        private formatters: IFormatter[]
    ) {}

    public formatDocument(document: TextDocument): string {
        const fullText = { text: document.getText() };

        this.fileIdentifier = new FileIdentifier(
            document.fileName,
            document.version
        );

        const parseResult = this.parserHelper.parse(
            this.fileIdentifier,
            document.getText()
        );

        this.formatCode(fullText, parseResult.tree);

        return fullText.text;
    }

    private formatCode(fullText: FullText, tree?: Tree) {
        const parseResult = this.parserHelper.parse(
            this.fileIdentifier,
            fullText.text
        );

        this.deepRun(parseResult.tree.rootNode, fullText);
    }

    private deepRun(node: SyntaxNode, fullText: FullText) {
        node.children.forEach((child) => {
            this.deepRun(child, fullText);
        });

        const codeEdit = this.parse(node, fullText);

        if (codeEdit !== undefined) {
            this.insertChangeIntoTree(node.tree, codeEdit);
            this.insertChangeIntoFullText(codeEdit, fullText);
        }
    }

    private insertChangeIntoTree(
        tree: Tree,
        codeEdit: CodeEdit | CodeEdit[]
    ): void {
        if (Array.isArray(codeEdit)) {
            codeEdit.forEach((oneCodeEdit) => {
                tree.edit(oneCodeEdit.edit);
            });
        } else {
            tree.edit(codeEdit.edit);
        }
    }

    private insertChangeIntoFullText(
        codeEdit: CodeEdit | CodeEdit[],
        fullText: FullText
    ): void {
        if (Array.isArray(codeEdit)) {
            codeEdit.forEach((oneCodeEdit) => {
                fullText.text =
                    fullText.text.slice(0, oneCodeEdit.edit.startIndex) +
                    oneCodeEdit.text +
                    fullText.text.slice(oneCodeEdit.edit.oldEndIndex);
            });
        } else {
            fullText.text =
                fullText.text.slice(0, codeEdit.edit.startIndex) +
                codeEdit.text +
                fullText.text.slice(codeEdit.edit.oldEndIndex);
        }
    }

    private parse(
        node: SyntaxNode,
        fullText: FullText
    ): CodeEdit | CodeEdit[] | undefined {
        let result: CodeEdit | CodeEdit[] | undefined;

        this.formatters.some((formatter) => {
            if (formatter.match(node)) {
                result = formatter.parse(node, fullText);

                if (result !== undefined) {
                    if (!this.isScopeOK(node, result, formatter)) {
                        result = undefined;
                    }
                }
                return true;
            }
            return false;
        });

        return result;
    }

    private isScopeOK(
        node: SyntaxNode,
        result: CodeEdit | CodeEdit[],
        formatter: IFormatter
    ): boolean {
        if (formatter instanceof BlockFormater) {
            return true;
        }

        console.log("BAD SCOPE - TODO");
        return false;
    }
}

export interface CodeEdit {
    edit: Edit;
    text: string;
}

export interface FullText {
    text: string;
}
