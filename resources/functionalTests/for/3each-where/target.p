/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true,
"AblFormatter.forFormatting": true
}*/

for each Customer where
         Customer.var = 1:
    Customer.var += 1.
    Customer.var *= 2.
    Customer.var /= 3.
end.