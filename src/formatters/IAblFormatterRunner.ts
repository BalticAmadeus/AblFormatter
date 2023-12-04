import { TextDocument } from "vscode";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatter } from "./IAblFormatter";
import { ParseResult } from "../model/ParseResult";

export interface IAblFormatterRunner {
    getSourceChanges(): SourceChanges;
    getDocument(): TextDocument;

    start(): IAblFormatterRunner;
    addFormatter(ablFormatter: IAblFormatter): IAblFormatterRunner;
    setDocument(document: TextDocument): IAblFormatterRunner;
    setParserResult(parserResult: ParseResult): IAblFormatterRunner;
    setFormatters(ablFormatter: IAblFormatter[]): IAblFormatterRunner;
}
