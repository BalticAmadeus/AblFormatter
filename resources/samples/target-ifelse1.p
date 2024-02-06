/* formatterSettingsOverride */
/* {
"AblFormatter.blockFormatting": true,
"AblFormatter.ifFormatting": true,
"abl.completion.upperCase": false
} */
define variable a as integer no-undo.
define variable b as integer no-undo.
define variable iCount as integer no-undo.
define variable iTotal as integer no-undo.

if a < b or 
   a > b then do:
    message "not equals".
end.
else do:
    if a = b then
        message "equals".
    else
        message "error".
end.

do iCount = 1 to 5:
    iTotal = iTotal + iCount.
end.
display iTotal.