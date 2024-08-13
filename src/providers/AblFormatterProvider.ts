import * as vscode from "vscode";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { AblFormatterFactory } from "./AblFormatterFactory";
import { ParseResult } from "../model/ParseResult";
import { FormattingEngine } from "../v2/formatterFramework/FormattingEngine";
import { ConfigurationManager2 } from "../utils/ConfigurationManager2";
import { EOL } from "../v2/model/EOL";

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

        try {
            const configurationManager = ConfigurationManager2.getInstance();

            const codeFormatter = new FormattingEngine(
                this.parserHelper,
                new FileIdentifier(document.fileName, document.version),
                configurationManager
            );

            const str = codeFormatter.formatText(
                document.getText(),
                new EOL(document.eol)
            );

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
