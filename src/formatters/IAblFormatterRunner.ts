import { TextDocument, } from "vscode";
import { SourceChanges } from "../model/SourceChanges";
import { ParseResult } from "../model/ParseResult";
import { IParserHelper } from "../parser/IParserHelper";

export interface IAblFormatterRunner {
    getSourceChanges(): SourceChanges;
    getDocument(): TextDocument;

    start(): IAblFormatterRunner;
    setDocument(document: TextDocument): IAblFormatterRunner;
    setParserResult(parserResult: ParseResult): IAblFormatterRunner;
    setParserHelper(parserHelper: IParserHelper): IAblFormatterRunner;
}
