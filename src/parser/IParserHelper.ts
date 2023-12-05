import { FileIdentifier } from "../model/FileIdentifier";
import { ParseResult } from "../model/ParseResult";

export interface IParserHelper {
    parse(fileIdentifier: FileIdentifier, text: string): ParseResult;
}
