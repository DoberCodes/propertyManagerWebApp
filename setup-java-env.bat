@echo off
REM Java Environment Setup for Property Manager
REM Add this to your PATH to use keytool and java commands directly

setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
setx PATH "%PATH%;C:\Program Files\Android\Android Studio\jbr\bin"

echo.
echo JAVA_HOME and PATH variables have been set!
echo Please restart your terminal for changes to take effect.
echo.
echo Verify with: java -version
pause
