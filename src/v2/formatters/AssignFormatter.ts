import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../formatterFramework/IFormatter";
import { CodeEdit } from "../model/CodeEdit";
import { FullText } from "../model/FullText";
import { AFormatter } from "./AFormatter";
import { RegisterFormatter } from "../formatterFramework/formatterDecorator";

@RegisterFormatter
export class AssignFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "assignFormatting";

    match(node: Readonly<SyntaxNode>): boolean {
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        return undefined;
    }
}
