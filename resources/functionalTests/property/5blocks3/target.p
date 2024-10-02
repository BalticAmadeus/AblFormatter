/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true,
"AblFormatter.propertyFormatting": true }*/
 
class Writer implements IWebRequest:
    define static public property Registry as BuilderRegistry no-undo
        get():
            define variable oRegistry as BuilderRegistry no-undo.
            if not valid-object(AuthenticationRequestWriterBuilder:Registry)
            then do:
                assign
                    oRegistry = new BuilderRegistry(get-class(IHttpMessageWriter))
                    .
                AuthenticationRequestWriterBuilder:InitializeRegistry(oRegistry).
                assign
                    AuthenticationRequestWriterBuilder:Registry = oRegistry
                    .
            end.
            return AuthenticationRequestWriterBuilder:Registry.
        end get.
        private set.
         
end class.