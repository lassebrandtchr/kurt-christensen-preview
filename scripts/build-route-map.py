#!/usr/bin/env python3
"""
Bygger src/data/route-map.json (SVG-stier) til kortet på Kontakt ud fra rigtige OpenStreetMap-data.
Kør kun, når kortet skal laves om. Rådata hentes manuelt (se README) og ligger IKKE i repoet:
  roads.json   Overpass: way[highway~motorway|trunk|primary|secondary|tertiary](55.28,8.24,55.64,9.17); out tags geom;
  extra.json   Overpass: way[natural=coastline](55.25,8.30,55.62,9.15); out geom;
  route_<by>.json  OSRM: /route/v1/driving/<by>;8.705573,55.46282?overview=full&geometries=geojson
Brug: python3 scripts/build-route-map.py <mappe-med-rådata>
Data © OpenStreetMap-bidragydere (ODbL) – attribution vises under kortet.
"""
import json, math, sys, os

RAW = sys.argv[1]
KURT = (55.46282, 8.705573)          # Ribevej 11, 6740 Bramming (Nominatim, OSM node 928672334)
LAT0, LAT1 = 55.300, 55.625           # udsnit centreret omkring Bramming
LON0, LON1 = 8.255, 9.155
W = 1000
KX = math.cos(math.radians(KURT[0]))
H = round(W * (LAT1 - LAT0) / ((LON1 - LON0) * KX))

def xy(lat, lon):
    return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)

def dp(pts, tol):
    """Douglas–Peucker-forenkling."""
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, 0.0
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + x1 * y0 - y1 * x0) / n
        if d > dmax:
            i, dmax = k, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: i + 1], tol)[:-1] + dp(pts[i:], tol)

def inside(p, m=40):
    return -m <= p[0] <= W + m and -m <= p[1] <= H + m

def d_of(pts):
    return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)

def clip_runs(pts):
    """Del en linje i stykker, der ligger inden for udsnittet."""
    runs, cur = [], []
    for p in pts:
        if inside(p):
            cur.append(p)
        elif cur:
            runs.append(cur); cur = []
    if cur:
        runs.append(cur)
    return [r for r in runs if len(r) > 1]

roads = json.load(open(os.path.join(RAW, 'roads.json')))['elements']
CLASS = {'motorway': 'major', 'trunk': 'major', 'primary': 'major', 'secondary': 'minor', 'tertiary': 'local'}
TOL = {'major': 0.8, 'minor': 1.0, 'local': 1.4}
out_roads = {'major': [], 'minor': [], 'local': []}
for e in roads:
    c = CLASS.get(e['tags'].get('highway'))
    if not c:
        continue
    pts = [xy(p['lat'], p['lon']) for p in e['geometry']]
    for run in clip_runs(pts):
        out_roads[c].append(d_of(dp(run, TOL[c])))

extra = json.load(open(os.path.join(RAW, 'extra.json')))['elements']
coast = []
for e in extra:
    if e.get('tags', {}).get('natural') != 'coastline':
        continue
    pts = [xy(p['lat'], p['lon']) for p in e['geometry']]
    for run in clip_runs(pts):
        coast.append(d_of(dp(run, 1.0)))

TOWNS = {
    'esbjerg': ('Esbjerg', 55.4664892, 8.4520751),
    'ribe': ('Ribe', 55.3284036, 8.7647838),
    'vejen': ('Vejen', 55.4743417, 9.1317951),
}
routes = {}
for key, (name, lat, lon) in TOWNS.items():
    r = json.load(open(os.path.join(RAW, f'route_{key}.json')))['routes'][0]
    pts = [xy(la, lo) for lo, la in r['geometry']['coordinates']]
    routes[key] = {
        'name': name,
        'km': round(r['distance'] / 1000),
        'd': d_of(dp(pts, 0.6)),
        'at': [round(v, 1) for v in xy(lat, lon)],
    }

data = {
    'w': W, 'h': H,
    'kmW': round((LON1 - LON0) * 111.32 * KX, 2),   # km for hele bredden (til målestok)
    'kurt': [round(v, 1) for v in xy(*KURT)],
    'roads': {k: ''.join(v) for k, v in out_roads.items()},
    'coast': ''.join(coast),
    'routes': routes,
    'labels': {
        'fano': [round(v, 1) for v in xy(55.42, 8.41)],
        'vadehavet': [round(v, 1) for v in xy(55.345, 8.47)],
    },
}
dst = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'route-map.json')
os.makedirs(os.path.dirname(dst), exist_ok=True)
json.dump(data, open(dst, 'w'), separators=(',', ':'))
print('ok', W, H, {k: len(v) for k, v in out_roads.items()}, 'coast', len(coast), 'bytes', os.path.getsize(dst))
