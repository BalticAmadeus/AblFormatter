import * as vscode from "vscode";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { AblFormatterFactory } from "./AblFormatterFactory";
import { ParseResult } from "../model/ParseResult";

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
