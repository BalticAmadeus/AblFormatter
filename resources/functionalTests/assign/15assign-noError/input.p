/* formatterSettingsOverride */
/*  { "AblFormatter.assignFormatting": true,
"abl.completion.upperCase": true,
"AblFormatter.assignFormattingAssignLocation": "New",
"AblFormatter.assignFormattingAlignRightExpression": "Yes",
"AblFormatter.assignFormattingEndDotLocation": "New aligned"}*/

DEFINE VARIABLE number11 AS INTEGER NO-UNDO.
DEFINE VARIABLE number2  AS INTEGER NO-UNDO INITIAL 3.
DEFINE VARIABLE number3  AS INTEGER NO-UNDO INITIAL 3.

ASSIGN
      number2 = 2
            number3 = 2
number11 = 2 NO-ERROR
    .
