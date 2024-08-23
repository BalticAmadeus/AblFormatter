/* formatterSettingsOverride */
/*  { "AblFormatter.temptableFormatting": true,
      "abl.completion.upperCase": true}*/

DEFINE TEMP-TABLE temp-item
FIELD cat-page  
LIKE Item.CatPage
FIELD inventory LIKE Item.Price LABEL "Inventory Value"
INDEX cat-page  
IS PRIMARY cat-page ASCENDING
INDEX inventory-value inventory DESCENDING.
