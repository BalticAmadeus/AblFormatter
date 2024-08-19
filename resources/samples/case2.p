/* formatterSettingsOverride */
/*  { "AblFormatter.caseFormatting": true,
    "abl.completion.upperCase": true,
    "AblFormatter.blockFormatting": false}*/
DEFINE VARIABLE pay-stat AS INTEGER NO-UNDO INITIAL 1.

CASE pay-stat :WHEN 1 THEN
    MESSAGE "HELLO".
END CASE.

    
