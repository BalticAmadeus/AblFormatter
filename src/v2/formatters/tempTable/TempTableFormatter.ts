import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { TempTableSettings } from "./TempTableSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import {
    definitionKeywords,
    SyntaxNodeType,
} from "../../../model/SyntaxNodeType";

@RegisterFormatter
export class TempTableFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "temptableFormatting";
    private readonly settings: TempTableSettings;

    private startColumn = 0;
    private temptableValueColumn = 0;
    private temptableBodyValue = "";

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new TempTableSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === SyntaxNodeType.TemptableDefinition) {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);

        this.collectTemptableStructure(node, fullText);
        return this.getCodeEdit(node, text, this.temptableBodyValue, fullText);
    }

    private collectTemptableStructure(node: SyntaxNode, fullText: FullText) {
        this.startColumn = FormatterHelper.getActualStatementIndentation(
            node,
            fullText
        );
        this.temptableValueColumn = this.startColumn + this.settings.tabSize();
        this.temptableBodyValue = this.getTemptableBlock(node, fullText);
    }

    private getTemptableBlock(node: SyntaxNode, fullText: FullText): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getTemptableExpressionString(
                    child,
                    fullText.eolDelimiter.concat(
                        " ".repeat(this.temptableValueColumn)
                    ),
                    fullText
                )
            );
        });

        resultString += ".";

        return resultString;
    }

    private getTemptableExpressionString(
        node: SyntaxNode,
        separator: string,
        fullText: FullText
    ): string {
        let newString = "";

        switch (node.type) {
            case definitionKeywords.hasFancy(node.type, ""):
                newString = FormatterHelper.getCurrentText(node, fullText);
                break;
            case SyntaxNodeType.FieldDefinition:
            case SyntaxNodeType.IndexDefinition:
                node.children.forEach((child) => {
                    newString = newString.concat(
                        this.getTemptableExpressionString(
                            child,
                            fullText.eolDelimiter.concat(
                                " ".repeat(this.temptableValueColumn)
                            ),
                            fullText
                        )
                    );
                });

                newString = separator + newString;
                break;
            case SyntaxNodeType.LikeKeyword:
                if (
                    node.parent!.type.trim() ===
                        SyntaxNodeType.FieldDefinition ||
                    node.parent!.type.trim() === SyntaxNodeType.IndexDefinition
                ) {
                    newString =
                        " " +
                        FormatterHelper.getCurrentText(node, fullText).trim();
                } else {
                    newString =
                        separator +
                        FormatterHelper.getCurrentText(node, fullText).trim();
                }
                break;
            case SyntaxNodeType.FieldKeyword:
            case SyntaxNodeType.IndexKeyword:
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
            case SyntaxNodeType.Error:
                newString = FormatterHelper.getCurrentText(node, fullText);
                break;
            default:
                newString =
                    " " + FormatterHelper.getCurrentText(node, fullText).trim();
                break;
        }
        return newString;
    }
}
