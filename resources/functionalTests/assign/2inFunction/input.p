/* formatterSettingsOverride */
/*  { "AblFormatter.assignFormatting": true,
"abl.completion.upperCase": true,
"AblFormatter.assignFormattingAssignLocation": "New",
"AblFormatter.assignFormattingAlignRightExpression": "Yes",
"AblFormatter.assignFormattingEndDotLocation": "New aligned"}*/

FUNCTION sumNumbers RETURNS INTEGER (number3 AS INTEGER, number4 AS INTEGER):
    DEFINE VARIABLE number11 AS INTEGER NO-UNDO.
    DEFINE VARIABLE number2 AS INTEGER NO-UNDO.

ASSIGN
    number11 = number3
       number2 = number4
.
RETURN number11 + number2.
END FUNCTION.