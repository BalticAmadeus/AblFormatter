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
    DEFINE VARIABLE i AS INTEGER NO-UNDO.
    i = 2.

    CASE i:
                WHEN 1 THEN
                MESSAGE "Case 1".
        WHEN 2 THEN
            MESSAGE "Case 2".
            WHEN 3 THEN
            MESSAGE "Case 3".
            OTHERWISE
            MESSAGE "No match found".
            END CASE.
END PROCEDURE.