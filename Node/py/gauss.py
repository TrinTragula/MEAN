from numpy import loadtxt
from numpy import exp
from scipy.optimize import curve_fit
import sys

data = loadtxt(sys.argv[1])
peaks = loadtxt(sys.argv[2])
peak = int(sys.argv[3])
window = int(sys.argv[4])

p = int(peaks[peak][0])
point = float(peaks[peak][0])
data = list(map(lambda x: x[1], data))

left = p - window / 2
right = p + window / 2

data = data[left:right]

# Define model function to be used to fit to the data above:
def gaussian(x, *p):
    A, mu, sigma = p
    return A*exp(-(x-mu)**2/(2.*sigma**2))

# p0 is the initial guess for the fitting coefficients (A, mu and sigma above)
p0 = [1., p, 1.]
baseline = range(left, right)

best_vals, covar = curve_fit(gaussian, baseline, data, p0)
area = best_vals[0]
mu = best_vals[1]
sigma = best_vals[2]

with open("data/calibrating_{0}_fitData.txt".format(peak), 'w+') as f:
    f.write("{0}:{1}:{2}".format(area,mu,sigma))
