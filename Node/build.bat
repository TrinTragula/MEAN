@ECHO OFF
@RD /S /Q "D:/temp/mean-win32-x64"

electron-packager . --icon=icon.ico --overwrite --out D:/temp

@COPY "D:/temp/mean-win32-x64/resources/app/DataCruncher" "D:/temp/mean-win32-x64/DataCruncher"
@COPY "D:/temp/mean-win32-x64/resources/app/py" "D:/temp/mean-win32-x64/py"
@MKDIR "D:/temp/mean-win32-x64/data"
@COPY "C:/Users/Daniele/Desktop/Tesi/coincidenze_vere.sqlite" "D:/temp/mean-win32-x64/coincidenze_vere.sqlite"