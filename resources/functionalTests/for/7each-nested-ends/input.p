/* formatterSettingsOverride */
/*  { "AblFormatter.forFormatting": true}*/

FOR EACH ttCustomer:
  FOR EACH ttOrder WHERE ttOrder.CustomerID = ttCustomer.CustomerID:
      FOR EACH ttOrderLine WHERE ttOrderLine.OrderID = ttOrder.OrderID:
          FOR EACH ttProduct WHERE ttProduct.ProductID = ttOrderLine.ProductID:
              FOR EACH ttSupplier WHERE ttSupplier.SupplierID = ttProduct.SupplierID:
      END. END.
      END. END. END.
