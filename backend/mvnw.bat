@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "MVN_BIN=C:\Users\bhavy\.m2\wrapper\dists\apache-maven-3.9.9-bin\4nf9hui3q3djbarqar9g711ggc\apache-maven-3.9.9\bin\mvn.cmd"
call "%MVN_BIN%" %*
