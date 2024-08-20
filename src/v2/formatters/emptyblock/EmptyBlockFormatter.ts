import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { EmptyBlockSettings } from "./EmptyBlockSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class EmptyBlockFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "emptyBlockFormatting";
    private readonly settings: EmptyBlockSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new EmptyBlockSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type !== SyntaxNodeType.DoBlock) {
            return false;
        }

        for (let child of node.children) {
            if (
                child.type === SyntaxNodeType.Body ||
                child.type === SyntaxNodeType.CaseBody ||
                child.type === SyntaxNodeType.ClassBody
            ) {
                return false;
            }
        }
        return true;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        const statementIndentation =
            FormatterHelper.getActualStatementIndentation(node, fullText);

        const lastLine = FormatterHelper.getCurrentText(node, fullText)
            .split(fullText.eolDelimiter)
            .slice(-1)[0];

        const endNode = node.children.find(
            (child) => child.type === SyntaxNodeType.EndKeyword
        );

        if (endNode !== undefined) {
            const endRowDelta =
                statementIndentation -
                FormatterHelper.getActualTextIndentation(lastLine, fullText);
            console.log("ind: " + statementIndentation);
            console.log(
                "endInd: " +
                    FormatterHelper.getActualTextIndentation(lastLine, fullText)
            );
            console.log("indLastLine: " + lastLine);
            console.log(
                "indFirstLine: " +
                    FormatterHelper.getCurrentText(node, fullText)
            );
            console.log("indchildren: " + node.childCount);
            node.children.forEach((child) => {
                console.log(
                    "indchild: " +
                        FormatterHelper.getCurrentText(child, fullText)
                );
            });

            // if (endRowDelta !== 0) {
            //     indentationEdits.push({
            //         line: parent.endPosition.row - parent.startPosition.row,
            //         lineChangeDelta: endRowDelta,
            //     });
            // }
        }

        return undefined;
    }

    private applyIndentationEdit(
        code: string,
        indentationEdit: IndentationEdits,
        fullText: FullText
    ) {}
}

interface IndentationEdits {
    line: number;
    lineChangeDelta: number;
}
