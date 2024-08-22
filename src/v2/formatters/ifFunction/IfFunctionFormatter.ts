import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IfFunctionSettings } from "./IfFunctionSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class IfFunctionFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "IfFunctionFormatting";
    private readonly settings: IfFunctionSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new IfFunctionSettings(configurationManager);
    }

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
