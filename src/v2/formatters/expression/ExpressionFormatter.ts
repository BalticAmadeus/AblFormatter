import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { ExpressionSettings } from "./ExpressionSettings";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class ExpressionFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "expressionFormatting";
    private readonly settings: ExpressionSettings;
    private lastComparisonExpressionColumn = 0;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new ExpressionSettings(configurationManager);
    }
    match(node: Readonly<SyntaxNode>): boolean {
        if (
            node.type === SyntaxNodeType.LogicalExpression ||
            node.type === SyntaxNodeType.ComparisonExpression ||
            node.type === SyntaxNodeType.ParenthesizedExpression ||
            node.type === SyntaxNodeType.AdditiveExpression ||
            node.type === SyntaxNodeType.MultiplicativeExpression ||
            node.type === SyntaxNodeType.Assignment ||
            node.type === SyntaxNodeType.UnaryExpression
        ) {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        const newText = FormatterHelper.collectExpression(node, fullText);
        return this.getCodeEdit(node, text, newText, fullText);
    }
}
