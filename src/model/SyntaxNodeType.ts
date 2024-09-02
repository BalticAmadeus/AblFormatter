import { MyFancySet } from "../utils/MyFancySet";

export enum SyntaxNodeType {
    Error = "ERROR",

    AvailableExpression = "available_expression",
    CaseStatement = "case_statement",
    CaseBody = "case_body",
    CaseWhenBranch = "case_when_branch",
    CaseOtherwiseBranch = "case_otherwise_branch",
    DoBlock = "do_block",
    Body = "body",
    ClassBody = "class_body",
    InterfaceBody = "interface_body",
    IfStatement = "if_statement",
    ElseStatement = "else_statement",
    AblStatement = "abl_statement",
    LogicalExpression = "logical_expression",
    WhenExpression = "when_expression",
    TemptableDefinition = "temp_table_definition",
    PropertyDefinition = "property_definition",
    FieldDefinition = "field_definition",
    IndexDefinition = "index_definition",
    VariableDefinition = "variable_definition",
    VariableAssignment = "variable_assignment",
    ConstructorDefinition = "constructor_definition",
    DestructorDefinition = "destructor_definition",
    MethodDefinition = "method_definition",
    FindStatement = "find_statement",
    WhereClause = "where_clause",
    UndoStatement = "undo_statement",
    AssignStatement = "assign_statement",
    Assignment = "assignment",
    SourceCode = "source_code",
    ForStatement = "for_statement",
    QueryTuning = "query_tuning",
    SortClause = "sort_clause",
    ComparisonExpression = "comparison_expression",
    TernaryExpression = "ternary_expression",
    ParenthesizedExpression = "parenthesized_expression",
    BooleanLiteral = "boolean_literal",
    ElseIfStatement = "else_if_statement",
    ReturnStatement = "return_statement",
    FunctionCallStatement = "function_call_statement",
    UsingStatement = "using_statement",
    ClassStatement = "class_statement",
    FinallyStatement = "finally_statement",
    FunctionStatement = "function_statement",
    CatchStatement = "catch_statement",
    ProcedureStatement = "procedure_statement",
    RepeatStatement = "repeat_statement",
    OnStatement = "on_statement",
    Getter = "getter",
    Setter = "setter",
    LeftParenthesis = "(",
    RightParenthesis = ")",

    // keywords
    WhenKeyword = "WHEN",
    ThenKeyword = "THEN",
    ElseKeyword = "ELSE",
    AndKeyword = "AND",
    OrKeyword = "OR",
    OtherwiseKeyword = "OTHERWISE",
    FieldKeyword = "FIELD",
    IndexKeyword = "INDEX",
    LikeKeyword = "LIKE",
    FirstKeyword = "FIRST",
    LastKeyword = "LAST",
    NextKeyword = "NEXT",
    PrevKeyword = "PREV",
    WhereKeyword = "WHERE",
    ShareLockKeyword = "SHARE-LOCK",
    ExclLockKeyword = "EXCLUSIVE-LOCK",
    NoLockKeyword = "NO-LOCK",
    NoWaitKeyword = "NO-WAIT",
    NoPrefetchKeyword = "NO-PREFETCH",
    NoErrorKeyword = "NO-ERROR",
    AssignKeyword = "ASSIGN",
    EachKeyword = "EACH",
    EndKeyword = "END",
    IfKeyword = "IF",
    DefineKeyword = "DEFINE",
    DefiKeyword = "DEFI",
    DefKeyword = "DEF",
}

export const afterThenStatements = new MyFancySet<string>([
    SyntaxNodeType.ReturnStatement,
    SyntaxNodeType.AblStatement,
    SyntaxNodeType.FunctionCallStatement,
    SyntaxNodeType.AssignStatement,
    SyntaxNodeType.VariableAssignment,
    SyntaxNodeType.UndoStatement,
]);

export const definitionKeywords = new MyFancySet<string>([
    SyntaxNodeType.DefineKeyword,
    SyntaxNodeType.DefiKeyword,
    SyntaxNodeType.DefKeyword,
]);

export const bodyBlockKeywords = new MyFancySet<string>([
    SyntaxNodeType.Body,
    SyntaxNodeType.CaseBody,
    SyntaxNodeType.ClassBody,
    SyntaxNodeType.InterfaceBody,
]);
