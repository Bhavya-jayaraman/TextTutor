@REM Maven Wrapper batch script for Windows Command Prompt / PowerShell.
@REM This script downloads Maven automatically if it is not already cached.
@REM Run as: mvnw.cmd <maven-goals>  e.g.  mvnw.cmd test

@echo off
setlocal

set WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar
set WRAPPER_PROPERTIES=%~dp0.mvn\wrapper\maven-wrapper.properties

if defined JAVA_HOME (
    set JAVACMD=%JAVA_HOME%\bin\java.exe
) else (
    set JAVACMD=java
)

"%JAVACMD%" ^
    -classpath "%WRAPPER_JAR%" ^
    "-Dmaven.multiModuleProjectDirectory=%~dp0" ^
    org.apache.maven.wrapper.MavenWrapperMain %*
