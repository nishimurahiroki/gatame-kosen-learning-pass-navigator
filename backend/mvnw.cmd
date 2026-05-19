@REM Maven Wrapper for Windows. Use JDK 21 on PATH or set JAVA_HOME.
@REM Example: .\mvnw.cmd spring-boot:run  (goal uses a colon, not a hyphen)
@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@REM Do not use %%~sI short paths; they can be empty for non-ASCII paths and break WRAPPER_JAR.

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
  echo ERROR: Maven wrapper jar not found: %WRAPPER_JAR%
  exit /b 1
)

set "JAVA_EXE=java"
if defined JAVA_HOME set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"

"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*

exit /b %ERRORLEVEL%
