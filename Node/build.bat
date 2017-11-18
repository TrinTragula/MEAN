@ECHO OFF
@RD /S /Q coincidence-win32-x64
electron-packager . --icon=icon.ico --overwrite
REM mkdir "coincidence-win32-x64\DataCruncher"
REM mkdir "coincidence-win32-x64\data"
REM MOVE "coincidence-win32-x64\resources\app\DataCruncher" "coincidence-win32-x64\DataCruncher\"
REM MOVE "coincidence-win32-x64\resources\app\data" "coincidence-win32-x64\data\"