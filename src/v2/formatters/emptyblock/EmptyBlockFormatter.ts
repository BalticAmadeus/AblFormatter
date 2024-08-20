import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { EmptyBlockSettings } from "./EmptyBlockSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class EmptyBlockFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "emptyBlockFormatting";
    private readonly settings: EmptyBlockSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new EmptyBlockSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        let found: boolean = false;

        return found;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        throw new Error("Method not implemented.");
    }
}
