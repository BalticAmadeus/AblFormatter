/* formatterSettingsOverride */
/*  { "AblFormatter.forFormatting": true,
    "abl.completion.upperCase": true}*/
FOR FIRST Order EXCLUSIVE-LOCK WHERE 
          Order.CustNum < 12 OR
          Order.CustNum > 20:
    DISPLAY Order.CustNum Order.OrderDate.
END.