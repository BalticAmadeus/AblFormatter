/* formatterSettingsOverride */
/*  { "AblFormatter.temptableFormatting": true,
      "abl.completion.upperCase": true}*/

DEFINE SERIALIZABLE TEMP-TABLE ttCustomer NO-UNDO REFERENCE-ONLY LIKE Customer
    INDEX CustNum I PRIMARY UNIQUE ustNum
    INDEX CustNum IS PRIMARY UNIQUE CustNum.