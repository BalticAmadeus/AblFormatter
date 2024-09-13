/* formattersettingsoverride */
/*  { "AblFormatter.blockFormatting": true,
"AblFormatter.forFormatting": false}*/

do transaction:
    for each Customer no-lock:
Customer.id += 1.
    end.
end.