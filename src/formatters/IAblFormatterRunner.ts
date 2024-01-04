import { TextDocument, WorkspaceConfiguration } from "vscode";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatter } from "./IAblFormatter";
import { ParseResult } from "../model/ParseResult";

export interface IAblFormatterRunner {
    getSourceChanges(): SourceChanges;
    getDocument(): TextDocument;

    start(): IAblFormatterRunner;
    setDocument(document: TextDocument): IAblFormatterRunner;
    setParserResult(parserResult: ParseResult): IAblFormatterRunner;
}
