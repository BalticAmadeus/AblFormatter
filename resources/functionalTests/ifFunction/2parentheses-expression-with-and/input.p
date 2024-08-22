/* formatterSettingsOverride */
/*  { "AblFormatter.ifFunctionFormatting": true,
      "AblFormatter.ifFunctionFormattingAddParentheses": "Yes"}*/

assign
    a = if Customer.Balance > 10000 and Customer.Country = "USA" then 1 else 2
    .