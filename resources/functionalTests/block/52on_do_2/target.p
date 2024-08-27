/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true}*/

ON WRITE OF Customer NEW new-cust OLD old-cust DO:
    a += 3.
END.