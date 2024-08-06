import * as vscode from "vscode";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { AblFormatterFactory } from "./AblFormatterFactory";
import { ParseResult } from "../model/ParseResult";
import { Edit, Point, SyntaxNode, Tree } from "web-tree-sitter";
import { FormattingEngine } from "../v2/FormattingEngine";
import { IFormatter } from "../v2/IFormatter";
import { BlockFormater } from "../v2/BlockFormatter";

export class AblFormatterProvider
    implements
        vscode.DocumentRangeFormattingEditProvider,
        vscode.DocumentFormattingEditProvider
{
    private parserHelper: IParserHelper;
    private formatterFactory: AblFormatterFactory;
    public result: ParseResult | undefined;

    public constructor(parserHelper: IParserHelper) {
        this.parserHelper = parserHelper;
        this.formatterFactory = new AblFormatterFactory();
    }

    provideDocumentFormattingEdits(
        document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        console.log("AblFormatterProvider.provideDocumentFormattingEdits");

        this.result = this.parserHelper.parse(
            new FileIdentifier(document.fileName, document.version),
            document.getText()
        );

        const formatters: IFormatter[] = [new BlockFormater()];

        const codeFormatter = new FormattingEngine(
            this.parserHelper,
            new FileIdentifier(document.fileName, document.version),
            formatters
        );

        const str = codeFormatter.formatDocument(document);
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        console.log(str);
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        const editor = vscode.window.activeTextEditor;
        editor!.edit(
            (edit: vscode.TextEditorEdit) => {
                edit.replace(
                    new vscode.Range(
                        new vscode.Position(0, 0),
                        new vscode.Position(10000000, 10000000)
                    ),
                    str
                );
            },
            { undoStopBefore: false, undoStopAfter: false }
        );

        try {
            const runner = this.formatterFactory
                .getFormatterRunner()
                .setDocument(document)
                .setParserResult(this.result)
                .setParserHelper(this.parserHelper)
                .start();

            console.log(
                "Changes to be applied: \n",
                runner.getSourceChanges().textEdits
            );

            return runner.getSourceChanges().textEdits;
        } catch (e) {
            console.log(e);
            return;
        }
    }
    provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        console.log("Hiiiii1");
        throw new Error("Method not implemented.");
    }
    provideDocumentRangesFormattingEdits?(
        document: vscode.TextDocument,
        ranges: vscode.Range[],
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        console.log("Hiiiii2");
        throw new Error("Method not implemented.");
    }
}

function generateCodeFromNode(node: SyntaxNode): string {
    let code = "";

    function traverse(node: SyntaxNode) {
        code = replaceRange(
            code,
            node.startIndex,
            node.endIndex,
            node.hasChanges() ? " =" : node.text
        );
        node.children.forEach(traverse);
    }

    function replaceRange(
        s: string,
        start: number,
        end: number,
        substitute: string
    ) {
        return s.substring(0, start) + substitute + s.substring(end);
    }

    traverse(node);
    return code;
}

function generateCodeFromTree(tree: Tree): string {
    return generateCodeFromNode(tree.rootNode);
}
