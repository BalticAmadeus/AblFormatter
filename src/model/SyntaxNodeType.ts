export enum SyntaxNodeType {
    CaseStatement       = "case_statement",
    CaseBody            = "case_body",
    CaseWhenBranch      = "case_when_branch",
    CaseOtherwiseBranch = "case_otherwise_branch",
    DoBlock             = "do_block",
    Body                = "body",
    TemptableDefinition = "temp_table_definition",
    FieldDefinition     = "field_definition",
    IndexDefinition     = "index_definition",
    // keywords
    ThenKeyword      = "THEN",
    AndKeyword       = "AND",
    OrKeyword        = "OR",
    OtherwiseKeyword = "OTHERWISE",
    FieldKeyword     = "FIELD",
    IndexKeyword     = "INDEX"
}
