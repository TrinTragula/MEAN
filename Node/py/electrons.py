from __future__ import division
import numpy as np 
from scipy.special import erf

############
# FUNZIONI #
############

# Angolo solido
def solidangle(dist, area): 
    return 1 - np.cos(np.arctan2(dist, np.sqrt(area/np.pi)))/2

# Compton qualcosa
def cmpthdist(en, theta):
    return (1 + np.cos(theta)**2 + ((en/MEC2)**2)*(1 - np.cos(theta)**2)/(1 + (en/MEC2)*(1 - np.cos(theta))))*(1 + (en/MEC2)*(1 - np.cos(theta)))**(-2)

# Compton qualcos'altro
def cmpen(en, theta):
    return ((en**2)*(1 - np.cos(theta)))/(en + MEC2 - en*np.cos(theta))

# Boh?
def eledistfunc(x, xc, area, sigma, tau):
    return 0.5*(area/tau)*np.exp((0.5*(sigma/tau)**2-(xc - x)/tau))*(1 +erf(((xc - x)/sigma - sigma/tau)/np.sqrt(2)))

def fiten(en):
    return 0.138/(1 + 0.284*((en/MEC2)**(1.21)))

def backtot(en, ang):
    return np.exp(-np.log(fiten(en))*(1 - np.cos(ang))) * fiten(en)

def sigma(en):
    return np.round(1000*(0.0035 + 0.00018*en + 7.2* (10 ** (-8)) * (en ** 2)))

############
# COSTANTI #
############
MEC2 = 510.9989461
VC = 299792458
NA = 6.0221409*(10**23)
# Risoluzione del silicio e coda
ris = 3
tail = 2
#Energia massima dello spettro
enmax = 2000

###################################################
# Parametri fisici e geometrici della simulazione #
###################################################

#Attività media della sorgente in Bq e tempo di  misura in secondi*)
act = 10**4
time = 3600*4
nev = act*time
dist = 10
sray = 1.25
AREA = 300
dray = np.sqrt(AREA/np.pi)
ndec = np.round(nev*solidangle(dist, AREA))

# Parametri del rivelatore
dens = 2.329
PA = 28.0855
spes = 3
cost = (dens*NA/PA)*(10**(-24))
# Noise sull'adc
noise = np.round(ndec/enmax)

#Spettri di emissione dei gamma e degli elettroni e frazione di elettroni rispetto ai gamma
frac = 1
gammatab = np.loadtxt("G:\Mathematica Saltarelli\Simulazione_silli\80Ge_gam.txt")
eletab = np.loadtxt("G:\Mathematica Saltarelli\Simulazione_silli\80Ge_ele.txt")

gtot = np.sum(gammatab, axis=0)[1]*nev
etot = np.sum(eletab, axis=0)[1]*nev
griv = np.sum(gammatab, axis=0)[1]*ndec
eriv = np.sum(eletab, axis=0)[1]*ndec