import { SourceChanges } from "../model/SourceChanges";
import Parser from "web-tree-sitter";
import { AblFormatterRunner } from "./AblFormatterRunner";

export interface IAblFormatter {
    parseNode(node: Parser.SyntaxNode): void;

    getSourceChanges(): SourceChanges;

    setRunner(ablFormatterRunner: AblFormatterRunner): IAblFormatter;
}
