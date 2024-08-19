/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true}*/
DEFINE VARIABLE pay-stat AS INTEGER NO-UNDO INITIAL 1.

if pay-stat = 1 THEN
        DO: 
    MESSAGE "This account is unpaid.".
    MESSAGE "This account is partially paid.". 
END.

