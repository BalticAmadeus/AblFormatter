import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";

@RegisterFormatter
export class UsingFormatter extends AFormatter implements IFormatter {
    match(node: Readonly<SyntaxNode>): boolean {
        throw new Error("Method not implemented.");
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        throw new Error("Method not implemented.");
    }
}
