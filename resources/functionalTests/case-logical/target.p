/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": false,
"abl.completion.upperCase": true, 
"AblFormatter.caseFormatting": true,
"AblFormatter.caseFormattingWhenLocation": "New",
"AblFormatter.caseFormattingThenLocation": "New",
"AblFormatter.caseFormattingDoLocation": "New",
"AblFormatter.caseFormattingStatementLocation": "New",
"AblFormatter.caseFormattingOtherwiseLocation": "New"}*/

PROCEDURE testCase:
    DEFINE VARIABLE b AS LOGICAL NO-UNDO.
    b = TRUE.

    CASE b:
        WHEN TRUE THEN
            MESSAGE "True case".
        WHEN FALSE THEN
            MESSAGE "False case".
        OTHERWISE
            MESSAGE "Other case".
    END CASE.
END PROCEDURE.