import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IfSettings } from "./IfSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class IfFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private nextLineOfComparison = 3; // "IF "
    private ifBlockValueColumn = 0;
    private ifBodyValue = "";

    public static readonly formatterLabel = "ifFormatting";
    private readonly settings: IfSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new IfSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === SyntaxNodeType.IfStatement) {
            return true;
        }

        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectIfStructure(node, fullText);

        console.log("aaa", this.ifBodyValue);

        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.ifBodyValue
        );
    }

    private collectIfStructure(node: SyntaxNode, fullText: Readonly<FullText>) {
        this.startColumn = node.startPosition.column;
        this.ifBlockValueColumn = this.startColumn + this.settings.tabSize();
        this.ifBodyValue = this.getCaseBodyBranchBlock(node, fullText);
    }

    private getCaseBodyBranchBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        let doBlock = false;

        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.DoBlock) {
                doBlock = true;
            }
        });

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getIfExpressionString(
                    child,
                    "\r\n".concat(" ".repeat(this.ifBlockValueColumn)),
                    doBlock,
                    fullText
                )
            );
        });

        return resultString.trim();
    }

    private getIfExpressionString(
        node: SyntaxNode,
        separator: string,
        doBlock: boolean,
        fullText: Readonly<FullText>
    ): string {
        console.log(
            "if block stuff:      ",
            node.type,
            separator,
            doBlock,
            this.settings.newLineBeforeDo()
        );

        switch (node.type) {
            case SyntaxNodeType.ThenKeyword:
                return this.settings.newLineBeforeThen()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            case SyntaxNodeType.DoBlock:
                console.log(
                    "qqqqqqqqqqqqq",
                    FormatterHelper.getCurrentText(node, fullText),
                    node.text
                );
                return this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            default:
                return (
                    " " + FormatterHelper.getCurrentText(node, fullText).trim()
                );
        }

        return "";
        // switch (node.type.trim()) {
        //     case SyntaxNodeType.ThenKeyword:
        //         if (doBlock) {
        //             return node.text;
        //         } else {
        //             return ` ${node.text.trim()}${separator}`;
        //         }
        //     case SyntaxNodeType.ElseKeyword:
        //         if (doBlock) {
        //             return node.text;
        //         } else {
        //             return `${node.text.trim()}${separator}`;
        //         }
        //     case SyntaxNodeType.DoBlock:
        //         return this.ablFormatterCommon.getDoBlock(
        //             node,
        //             this.ifBlockValueColumn,
        //             this.startColumn
        //         );
        //     case SyntaxNodeType.AblStatement:
        //         return node.text + "\r\n".concat(" ".repeat(this.startColumn));
        //     case SyntaxNodeType.ElseStatement:
        //         let resultElseString = "";
        //         let doElseBlock = false;

        //         node.children.forEach((child) => {
        //             if (child.type === SyntaxNodeType.DoBlock) {
        //                 doElseBlock = true;
        //             }
        //         });

        //         node.children.forEach((child) => {
        //             resultElseString = resultElseString.concat(
        //                 this.getIfExpressionString(
        //                     child,
        //                     "\r\n".concat(" ".repeat(this.ifBlockValueColumn)),
        //                     doElseBlock
        //                 )
        //             );
        //         });

        //         return resultElseString;
        //     case SyntaxNodeType.BooleanLiteral:
        //         return node.text.trim();
        //     case SyntaxNodeType.AvailableExpression:
        //         return node.text.trim();
        //     case SyntaxNodeType.ParenthesizedExpression:
        //         return node.text.trim();
        //     case SyntaxNodeType.LogicalExpression:
        //         let resultLogicalExString = "";

        //         node.children.forEach((child) => {
        //             resultLogicalExString = resultLogicalExString.concat(
        //                 this.getIfExpressionString(
        //                     child,
        //                     "\r\n".concat(
        //                         " ".repeat(
        //                             this.startColumn + this.nextLineOfComparison
        //                         )
        //                     ),
        //                     false
        //                 )
        //             );
        //         });

        //         return resultLogicalExString;
        //     case SyntaxNodeType.AndKeyword:
        //     case SyntaxNodeType.OrKeyword:
        //         return " " + node.text.trim() + separator;
        //     case SyntaxNodeType.ComparisonExpression:
        //         return node.text.trim();
        //     case SyntaxNodeType.IfKeyword:
        //         return node.text.trim() + " ";
        //     default:
        //         return node.text.trim();
        // }
    }
}
