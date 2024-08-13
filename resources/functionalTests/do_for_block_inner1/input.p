/* formattersettingsoverride */
/*  { "ablformatter.blockformatting": true}*/

do transaction:
    for each Customer no-lock:
Customer.id += 1.
    end.
end.