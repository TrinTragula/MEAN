from __future__ import division
import numpy as np
from scipy.special import erf
import matplotlib.pyplot as plt
from scipy.interpolate import interp1d

############
# FUNZIONI #
############

# Angolo solido
def solidangle(dist, area):
    return 1 - np.cos(np.arctan2(dist, np.sqrt(area / np.pi))) / 2

# Compton qualcosa
def cmpthdist(en, theta):
    return (1 + np.cos(theta)**2 + ((en / MEC2)**2) * (1 - np.cos(theta)**2) / (1 + (en / MEC2) * (1 - np.cos(theta)))) * (1 + (en / MEC2) * (1 - np.cos(theta)))**(-2)

# Compton qualcos'altro
def cmpen(en, theta):
    return ((en**2) * (1 - np.cos(theta))) / (en + MEC2 - en * np.cos(theta))

# Boh?
def eledistfunc(x, xc, area, sigma, tau):
    return 0.5 * (area / tau) * np.exp((0.5 * (sigma / tau)**2 - (xc - x) / tau)) * (1 + erf(((xc - x) / sigma - sigma / tau) / np.sqrt(2)))

def fiten(en):
    return 0.138 / (1 + 0.284 * ((en / MEC2)**(1.21)))

def backtot(en, ang):
    return np.exp(-np.log(fiten(en)) * (1 - np.cos(ang))) * fiten(en)

def sigma(en):
    return np.round(1000 * (0.0035 + 0.00018 * en + 7.2 * (10 ** (-8)) * (en ** 2)))

############
# COSTANTI #
############
MEC2 = 510.9989461
VC = 299792458
NA = 6.0221409 * (10**23)
# Risoluzione del silicio e coda
ris = 3
tail = 2
# Energia massima dello spettro
enmax = 2000

###################################################
# Parametri fisici e geometrici della simulazione #
###################################################

# Attivita media della sorgente in Bq e tempo di  misura in secondi*)
act = 10**4
time = 3600 * 4
nev = act * time
dist = 10.0
sray = 1.25
AREA = 300
dray = np.sqrt(AREA / np.pi)
ndec = np.round(nev * solidangle(dist, AREA))

# Parametri del rivelatore
dens = 2.329
PA = 28.0855
spes = 3.0
cost = (dens * NA / PA) * (10**(-24))
# Noise sull'adc
noise = np.round(ndec / enmax)

# Spettri di emissione dei gamma e degli elettroni e frazione di elettroni rispetto ai gamma
frac = 1
gammatab = np.loadtxt(
    "D:\PENNETTA\Bianchetto\Tesi\Mathematica Saltarelli\Simulazione_silli\80Ge_gam.txt")
eletab = np.loadtxt(
    "D:\PENNETTA\Bianchetto\Tesi\Mathematica Saltarelli\Simulazione_silli\80Ge_ele.txt")

gtot = np.sum(gammatab, axis=0)[1] * nev
etot = np.sum(eletab, axis=0)[1] * nev
griv = np.sum(gammatab, axis=0)[1] * ndec
eriv = np.sum(eletab, axis=0)[1] * ndec

# Moltiplico i dati della tabella all'indice uno di frac
for e in eletab:
    e[1] = e[1] * frac

# Simulazione per gli elettroni
elesim = []
for e in eletab:
    print "Simulazione degli elettroni. Inizio il calcolo per l'energia " + str(e[0]) + " keV."
    for h in range(1, int(np.round(e[1] * ndec) + 1)):
        rndsray = sray * np.random.random_sample()
        rndsang = 2 * np.pi * np.random.random_sample()
        x0pos = rndsray * np.cos(rndsang)
        y0pos = rndsray * np.sin(rndsang)
        phivel = 2 * np.pi * np.random.random_sample()
        thetavel = np.arccos(2 * np.random.random_sample() - 1)
        u1 = np.sin(thetavel) * np.cos(phivel)
        u2 = np.sin(thetavel) * np.sin(phivel)
        u3 = np.cos(thetavel)
        xpos = x0pos + dist * (u1 / u3)
        ypos = y0pos + dist * (u2 / u3)
        if (xpos**2 + ypos**2) <= AREA / np.pi:
            res = [e[0], xpos, ypos, np.arctan2(np.sqrt(u1**2 + u2**2), u3)]
            elesim.append(res)

print elesim[0]

# Calcolo del backscattering
eletrasm = []
bstab = []

for k, e in enumerate(elesim):
    rndback = np.random.random_sample()
    nsigma = sigma(e[0]/abs(np.cos(e[3])))
    nmu = 1000 * np.sqrt(e[1]**2 + e[2]**2)
    rndpos = nsigma * np.random.randn() + nmu
    if (rndback >= backtot(e[0], e[3]) and float(rndpos/1000) <= np.sqrt(AREA / np.pi)):
        eletrasm.append(e[0])

print eletrasm[0]
elecnt = len(eletrasm)
bscnt = 0

for e in eletab:
    tmp1 = [i for i in elesim if i[0] == e[0]]
    tmp2 = [i for i in eletrasm if i == e[0]]
    bstab.append([e[0], float( (len(tmp1) - len(tmp2)) / len(tmp1))])
    bscnt += np.round(len(tmp1) - len(tmp2))
print bstab[0]
print bscnt

# Calcolo dello spettro
bspart = []
peak = []
tbs = []
for i,e in enumerate(eletab):
    bspart.append([])
    peak.append([])
    tbs.append(0)

for i, e in enumerate(eletab):
    tmp = [t for t in eletrasm if t == e[0]]
    bsval =  [t[1] for t in bstab if t[0] == e[0]]
    temptab = [0 for t in range(enmax)]
    for kt in range(int(np.floor(e[0]))):
        temptab[kt] = eledistfunc(e[0] - kt, 0.75 * e[0], 1, 0.05 * e[0], 0.5 * e[0])
    # Normalizzo i pesi
    temptabSum = sum(temptab)
    temptab = temptab / temptabSum
    peakPesi = [ eledistfunc(peso, e[0], 1, ris / 2.355, tail) for peso in range(enmax) ]
    peakPesiSum = sum(peakPesi)
    peakPesi = peakPesi / peakPesiSum
    tempRandomBsPart = []
    temppeak = []
    # SICURI ???????????????????
    for index in range(enmax):
        tempRandomBsPart.append(np.random.choice(range(len(temptab)), 1, p = temptab)[0])
        temppeak.append(np.random.choice(range(enmax), 1, p = peakPesi)[0])
    bspart[i] = np.bincount(tempRandomBsPart, minlength=enmax)
    peak[i] = np.bincount(temppeak, minlength=enmax)
print sum(bspart[0])
print sum(peak[10])

for i,e in enumerate(eletab):
    tbs[i] = 100 * sum(bspart[i]) / np.round(e[1] * ndec)

elespt = [ sum([bspart[k][i] + peak[k][i] for k in range(len(eletab))]) for i in range(enmax)]

# plt.plot(elespt[1:])
# plt.ylabel('Electrons')
# plt.show()

# Simulazione per i gamma

# Importiamo le sezioni d'urto per Compton, Fotoelettrico e PP in in barn/atomi
gamele = np.loadtxt("D:\PENNETTA\Bianchetto\Tesi\Mathematica Saltarelli\Simulazione_silli\silicon_gamma.txt")
# rawdata = [gamele[h + 6*k] for k in range(int(np.floor(len(gamele)/6))) for h in range(6)]

# Definiamo le sezioni d' urto : {energy, scattering Compton coerente + incoerente, fotoelettrico, produzione di coppia su sponda nucleare + elettronica, totale}
gameleElements = len([k[0] for k in gamele])
dati = np.zeros((gameleElements, 5))
for i in range(gameleElements):
    dati[i] = np.array([gamele[i][0], 
    gamele[i][1] + gamele[i][2], 
    gamele[i][3], 
    gamele[i][4] + gamele[i][5], 
    gamele[i][1] + gamele[i][2] + gamele[i][3] + gamele[i][4] + gamele[i][5]])
print dati.shape
x = [k[0] for k in dati]
y = [k[1] for k in dati]
cmpint = interp1d(x, y, kind='cubic')
y = [k[2] for k in dati]
pheint = interp1d(x, y, kind='cubic')
y = [k[3] for k in dati]
ppint = interp1d(x, y, kind='cubic')
y = [k[4] for k in dati]
allint = interp1d(x, y, kind='cubic')

# Calcolo dei gamma Compton, fotoelettrici e coppie
evset = []
gammatabLen = len([x[0] for x in gammatab])
cntc = np.zeros(gammatabLen)
cntph = np.zeros(gammatabLen)
cntpp = np.zeros(gammatabLen)


for k in range(gammatabLen):
    print "Simulazione dei Gamma. Calcolo per l'energia " + str(gammatab[k][0]) + " keV."
    # Indicatore del progresso di simulazione
    mcnt = 0
    # h parte da zero o da 1?
    totalToIterate = int(np.round(gammatab[k][1] * ndec))
    for h in np.arange(totalToIterate):
        if (h % 1000 == 0):
            print "Completato " + str(h * 100 / totalToIterate) + "%"
        rndsray = np.random.random_sample() * sray
        rndsang = np.random.random_sample() * 2 * np.pi
        x0pos = rndsray * np.cos(rndsang)
        y0pos = rndsray * np.sin(rndsang)
        phivel = np.random.random_sample() * 2 * np.pi 
        thetavel = np.arccos(2 * np.random.random_sample() - 1) - (np.pi /2)
        u1 = np.sin(thetavel) * np.cos(phivel)
        u2 = np.sin(thetavel) * np.sin(phivel)
        u3 = np.cos(thetavel)
        xpos = x0pos + dist * (u1/u3)
        ypos = y0pos + dist * (u2/u3)
        if (xpos ** 2 + ypos ** 2 <= dray **2):
            if (abs(np.tan(thetavel)) <= (dray/(dist + spes))):
                rspes = 0.1 * spes * np.sqrt(1 + np.tan(thetavel) ** 2)
            else:
                rspes = 0.1 * (dray - np.sqrt(xpos ** 2 + ypos ** 2)) * abs( 1.0 / np.tan(thetavel))
            cmpcs = 1 - np.exp(-cost * cmpint(0.001*gammatab[k][0]) * rspes)
            phecs = 1 - np.exp(-cost * pheint(0.001*gammatab[k][0]) * rspes)
            ppcs = 1 - np.exp(-cost * ppint(0.001*gammatab[k][0]) * rspes)
            totcs = cmpcs + phecs + ppcs
            rnd = np.random.random_sample()
        
        # Qua sul mathematica c'e' un a virgola, come se ci fosse un else
        # Ma non ha senso manco per niente, quindi deduco per qualche ragione sia il continuo
        # dell'if di prima e commento l'else

        # else:

            if (rnd <= totcs):
                if (0 <= rnd <= cmpcs):
                    cntc[k] += 1
                    pesitheta = [cmpthdist(gammatab[k][0], z) for z in np.arange(0, 2 * np.pi, 0.01)]
                    arraytheta = [z for z in np.arange(0, 2 * np.pi, 0.01)]
                    pesithetaSum = sum(pesitheta)
                    pesitheta = pesitheta / pesithetaSum
                    thetarnd = np.random.choice(arraytheta, 1, p=pesitheta)[0]
                    pesicpen = [ eledistfunc(z, cmpen(gammatab[k][0], thetarnd), 1, ris / 2.355, 0.1 * tail ) for z in np.arange(1, enmax)]
                    arraycpen = [ z for z in np.arange(1, enmax)]
                    pesicpenSum = sum(pesicpen)
                    pesicpen = pesicpen / pesicpenSum
                    cpen = np.random.choice(arraycpen, 1, p=pesicpen)[0]
                    evset.append(cpen)
                elif (cmpcs < rnd <= phecs + cmpcs):
                    cntph[k] += 1
                    pesiphen = [ eledistfunc(z, gammatab[k][0], 1, ris / 2.355, 0.1 * tail ) for z in range(1, enmax)]
                    arrayphen = [ z for z in range(1, enmax)]
                    pesiphenSum = sum(pesiphen)
                    pesiphen = pesiphen / pesiphenSum
                    phen = np.random.choice(arrayphen, 1, p=pesiphen)[0]
                    evset.append(phen)
                elif (phecs + cmpcs < rnd <= totcs):
                    cntpp[k] += 1
                    rnd1 = np.random.random_sample()
                    if (0 <= rnd1 < 0.95):
                        pesippen = [ z for z in range(1, enmax)]
                        arrayppen = [ eledistfunc(z, gammatab[k][0] - 2 * MEC2, 1, ris / 2.355, 0.1 * tail ) for z in range(1, enmax)]
                        pesippenSum = sum(pesippen)
                        pesippen = pesippen / pesippenSum
                        ppen = np.random.choice(arrayppen, 1, p=pesippen)[0]
                        evset.append(ppen)
                    elif (0.95 <= rnd1 < 0.999):
                        pesippen = [ z for z in range(1, enmax)]
                        arrayppen = [ eledistfunc(z, gammatab[k][0] - MEC2, 1, ris / 2.355, 0.1 * tail ) for z in range(1, enmax)]
                        pesippenSum = sum(pesippen)
                        pesippen = pesippen / pesippenSum
                        ppen = np.random.choice(arrayppen, 1, p=pesippen)[0]
                        evset.append(ppen)
                    elif (0.999 <= rnd1 <= 1):
                        pesippen = [ z for z in range(1, enmax)]
                        arrayppen = [ eledistfunc(z, gammatab[k][0], 1, ris / 2.355, 0.1 * tail ) for z in range(1, enmax)]
                        pesippenSum = sum(pesippen)
                        pesippen = pesippen / pesippenSum
                        ppen = np.random.choice(arrayppen, 1, p=pesippen)[0]
                        evset.append(ppen)
        mcnt += 1



