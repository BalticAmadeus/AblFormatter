/* formatterSettingsOverride */
/*  { "AblFormatter.findFormatting": true,
"abl.completion.upperCase": true}*/

FIND Order WHERE (Order.OrderStatus = "Shipped" AND (Order.ShipDate > TODAY - 7)) OR
(Order.OrderStatus = "Pending" AND (Order.OrderDate = TODAY)) no-lock.