/* formatterSettingsOverride */
/*  { "abl.completion.upperCase": true, 
"AblFormatter.caseFormatting": true,
"AblFormatter.blockFormatting": false}*/

DEFINE VARIABLE s AS CHARACTER NO-UNDO.
s = "B".

CASE s:
WHEN "A" THEN
    MESSAGE "Letter A".
WHEN "B" THEN
    MESSAGE "Letter B".
WHEN "C" THEN
    MESSAGE "Letter C".
OTHERWISE
    MESSAGE "Letter not recognized".
END CASE.