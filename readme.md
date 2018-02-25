# MEAN -  An Electron App for Nuclear Physics

![Sample screen](/sample_screen.png)

**MEAN** is a desktop application aimed at scientists and technicians coming from different backgrounds, 
with the aim of building a modern, user friendly software capable of helping them analyze the nuclear data available from experiments 
and analisys, started as an ispiration from the SPES INFN project. 
It makes use of data mining techniques in order to help identify nuclides using the public available nuclear databases present 
on-line and uses state of the art technologies to calibrate, fit and manipulate the data. 
It will be able to work with both simple spectra and coincidence matrices and it is divided into different modules 
working together without the user noticing. 

## Requirements:
- Windows is required for this version, since some components are based off C# code, 
but portability could be easily achieved rewriting the Data Cruncher module.
- numpy and scipy (download them **[here](https://www.lfd.uci.edu/~gohlke/pythonlibs/#scipy)** and install them with pip. 
The file you need depends on your architecture, e.g. if you have an x64 python 
installation you need *numpy-1.13.3+mkl-cp27-cp27m-win_amd64.whl* and *scipy-1.0.0rc2-cp27-cp27m-win_amd64.whl*)

## Installation:
Simply download the latest relase from **[here](https://github.com/TrinTragula/MEAN/releases)**.

## More information:
See the related project **[nuclear-toi](https://github.com/TrinTragula/nuclear-toi)**. My thesis will be included once it's done.


## To compile from source:
- cd node
- npm install
- cd ../CSharp
- Open in Visual Studio the .sln file and build for release
- Move the built files in node/DataCruncher
- Open the node folder in Visual Studio Code
- Press F5
