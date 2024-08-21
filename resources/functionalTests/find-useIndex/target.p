/* formatterSettingsOverride */
/*  { "AblFormatter.findFormatting": true,
"abl.completion.upperCase": true}*/

find Order where Order.OrderStatus = "Shipped" and
                 Order.ShipDate = today use-index OrderNum.