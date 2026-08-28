from pythermalcomfort.models import utci
import math

tdb = 30 # dry bulb
tr = 35 # mean radiant temperature
v = 2.0 # wind speed 10m above ground
rh = 50 # relative humidity

res = utci(tdb=tdb, tr=tr, v=v, rh=rh)
print("UTCI:", res)
