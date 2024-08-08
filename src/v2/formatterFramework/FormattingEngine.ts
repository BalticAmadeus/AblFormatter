import { SyntaxNode, Tree } from "web-tree-sitter";
import { IParserHelper } from "../../parser/IParserHelper";
import { FileIdentifier } from "../../model/FileIdentifier";
import { IFormatter } from "./IFormatter";
import { BlockFormater } from "../formatters/BlockFormatter";
import { CodeEdit } from "../model/CodeEdit";
import { FullText } from "../model/FullText";
import { IConfigurationManager } from "../../utils/IConfigurationManager";
import { ParseResult } from "../../model/ParseResult";

export class FormattingEngine {
    constructor(
        private parserHelper: IParserHelper,
        private fileIdentifier: FileIdentifier,
        private formatters: IFormatter[],
        private configurationManager: IConfigurationManager
    ) {}

    public formatText(fulfullTextString: string): string {
        const fullText: FullText = {
            text: fulfullTextString,
        };

        const parseResult = this.parserHelper.parse(
            this.fileIdentifier,
            fulfullTextString
        );

        this.settingsOverride(parseResult);

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

    private settingsOverride(parseResult: ParseResult) {
        const settingsString = this.getOverrideSettingsComment(
            parseResult.tree.rootNode
        );

        if (settingsString !== undefined) {
            this.configurationManager.setOverridingSettings(
                JSON.parse(settingsString)
            );
        }
    }

    public getOverrideSettingsComment(node: SyntaxNode): string | undefined {
        const firstChildNode = node.child(0);

        if (firstChildNode === null) {
            return undefined;
        }

        if (!firstChildNode.text.includes("formatterSettingsOverride")) {
            return undefined;
        }

        const secondChildNode = node.child(1);
        if (secondChildNode === null) {
            return undefined;
        }

        return secondChildNode.text.substring(
            2,
            secondChildNode.text.length - 2
        );
    }
}
