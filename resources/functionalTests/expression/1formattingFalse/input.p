DEFINE VARIABLE low-credit LIKE credit-limit LABEL "Low Credit Limit".
DEFINE VARIABLE hi-credit  LIKE credit-limit LABEL "High Credit Limit".

REPEAT:
  SET low-credit hi-credit WITH FRAME cr-range.
  FOR EACH Customer NO-LOCK WHERE
    (Customer.CreditLimit >= low-credit) AND 
    (Customer.CreditLimit <= hi-credit):
    DISPLAY Customer.CustNum Customer.Name Customer.CreditLimit.
  END.
END.