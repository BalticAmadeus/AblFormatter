export enum SyntaxNodeType {
    CaseStatement       = "case_statement",
    CaseBody            = "case_body",
    CaseWhenBranch      = "case_when_branch",
    CaseOtherwiseBranch = "case_otherwise_branch",
    DoBlock             = "do_block",
    Body                = "body",
    IfStatement         = "if_statement",
    ElseStatement       = "else_statement",
    AblStatement        = "abl_statement",
    LogicalExpression   = "logical_expression",
    TemptableDefinition = "temp_table_definition",
    FieldDefinition     = "field_definition",
    IndexDefinition     = "index_definition",
    // keywords
    ThenKeyword      = "THEN",
    ElseKeyword      = "ELSE",
    AndKeyword       = "AND",
    OrKeyword        = "OR",
    OtherwiseKeyword = "OTHERWISE",
    FieldKeyword     = "FIELD",
    IndexKeyword     = "INDEX",
    LikeKeyword      = "LIKE"
}
