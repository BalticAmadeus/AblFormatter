/* formatterSettingsOverride */
/*  { "AblFormatter.ifFormatting": true,
"AblFormatter.blockFormatting": true,
"AblFormatter.ifFormattingThenLocation": "Same",
"AblFormatter.ifFormattingDoLocation": "Same",
"AblFormatter.ifFormattingStatementLocation": "New"}*/

if a = b then
    message a.
else if true then do:
    message b.
end.    
else if false then do:
    if a = c or b = d then
        message false.
end.



if true then
    message "a".
else if false then
    message "b".    
else if false then do:
    message "b". 
end.    
else do:
    message "c".
end.