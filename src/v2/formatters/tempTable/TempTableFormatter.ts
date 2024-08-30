import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { TempTableSettings } from "./TempTableSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

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
        const newText = this.getPrettyBlock();
        // console.log("text:\n" + text);
        // console.log("newText:\n" + newText);
        return this.getCodeEdit(node, text, newText, fullText);
    }

    private collectTemptableStructure(
        node: SyntaxNode,
        fullText: FullText
    ): void {
        this.startColumn = node.startPosition.column;
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
            // console.log("currText:\n" + resultString);
        });

        return resultString.trim();
    }

    private getTemptableExpressionString(
        node: SyntaxNode,
        separator: string,
        fullText: FullText
    ): string {
        let newString = "";

        switch (node.type) {
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
            default:
                newString =
                    " " + FormatterHelper.getCurrentText(node, fullText).trim();
                break;
        }
        return newString;
    }

    private getPrettyBlock(): string {
        const block = "".concat(this.temptableBodyValue.trim()).concat(".");

        return block;
    }
}
