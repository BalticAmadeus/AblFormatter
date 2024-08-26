/* formatterSettingsOverride */
/*  { "abl.completion.upperCase": true, 
"AblFormatter.caseFormatting": true,
"AblFormatter.caseFormattingThenLocation": "New",
"AblFormatter.caseFormattingDoLocation": "New",
"AblFormatter.caseFormattingStatementLocation": "Same",
"AblFormatter.blockFormatting": true}*/

PROCEDURE testCase:
    DEFINE VARIABLE b AS LOGICAL NO-UNDO.
    b = TRUE.

    CASE b:
    WHEN TRUE THEN 
            MESSAGE "True case".
    WHEN FALSE THEN MESSAGE "False case".
    OTHERWISE 
    MESSAGE "Other case".
    END CASE.
END PROCEDURE.