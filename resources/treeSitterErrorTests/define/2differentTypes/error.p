DEFINE TEMP-TABLE ttCustomer NO-UNDO
    FIELD CustNum AS INTEGER
    FIELD Name AS CHARACTER.

DEFINE STREAM sStream.

DEFINE BUFFER bufCustomer FOR Customer.

DEFINE QUERY qTestQuery FOR Customer.