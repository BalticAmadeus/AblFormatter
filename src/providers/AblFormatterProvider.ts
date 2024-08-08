import * as vscode from "vscode";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { AblFormatterFactory } from "./AblFormatterFactory";
import { ParseResult } from "../model/ParseResult";
import { Edit, Point, SyntaxNode, Tree } from "web-tree-sitter";
import { FormattingEngine } from "../v2/formatterFramework/FormattingEngine";
import { IFormatter } from "../v2/formatterFramework/IFormatter";
import { BlockFormater } from "../v2/formatters/BlockFormatter";
import { AssignFormatter } from "../v2/formatters/AssignFormatter";
import { FormatterSettings } from "../v2/model/FormatterSettings";
import { ConfigurationManager2 } from "../utils/ConfigurationManager2";
import { FormatterFactory } from "../v2/formatterFramework/FormatterFactory";

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

        const configurationManager = ConfigurationManager2.getInstance();
        const formatterSettings = new FormatterSettings(configurationManager);

        const formatters = FormatterFactory.getFormatterInstances(
            configurationManager,
            formatterSettings
        );

        const codeFormatter = new FormattingEngine(
            this.parserHelper,
            new FileIdentifier(document.fileName, document.version),
            formatters,
            configurationManager
        );

        const str = codeFormatter.formatText(document.getText());
        console.log("result-start");
        console.log(str);
        console.log("result-end");

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
        } catch (e) {
            console.log(e);
            return;
        } finally {
            this.result = this.parserHelper.parse(
                new FileIdentifier(document.fileName, document.version),
                document.getText()
            );
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
