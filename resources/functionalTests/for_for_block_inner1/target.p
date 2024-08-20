/* formattersettingsoverride */
/*  { "AblFormatter.blockFormatting": true}*/

for each A no-lock:
    for each B no-lock where A.id = B.id:
        A.cnt += 1.
    end.
end.