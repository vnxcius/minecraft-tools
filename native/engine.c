/*
 * WebAssembly bindings for cubiomes (https://github.com/Cubitect/cubiomes, MIT).
 * Keeps one generator per dimension for the current version and seed. All buffers are
 * allocated by the caller through `alloc` / `release`.
 */
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "finders.h"
#include "generator.h"
#include "util.h"

#define EXPORT __attribute__((visibility("default")))

static Generator gens[3]; // overworld, nether, end
static int cur_mc = 0;
static uint64_t cur_seed = 0;

static Generator *gen_for_dim(int dim)
{
    return &gens[dim == DIM_NETHER ? 1 : dim == DIM_END ? 2 : 0];
}

EXPORT void *alloc(size_t n) { return malloc(n); }
EXPORT void release(void *p) { free(p); }

/* mc: cubiomes MC_* constant, seed: 64 bit world seed */
EXPORT void setup(int mc, uint64_t seed)
{
    cur_mc = mc;
    cur_seed = seed;
    const int dims[3] = {DIM_OVERWORLD, DIM_NETHER, DIM_END};
    for (int i = 0; i < 3; i++) {
        setupGenerator(&gens[i], mc, 0);
        applySeed(&gens[i], dims[i], seed);
    }
}

/* Biome ids of a rectangle: `scale` blocks per cell (1, 4, 16, 64, 256), origin and size in cells.
 * Writes sx*sz ints to `out` and returns 0 on success. */
EXPORT int biomes(int dim, int scale, int x, int z, int sx, int sz, int y, int *out)
{
    Generator *g = gen_for_dim(dim);
    Range r = {scale, x, z, sx, sz, y, 1};
    int *cache = allocCache(g, r);
    if (!cache) return -1;
    int err = genBiomes(g, cache, r);
    if (!err) memcpy(out, cache, (size_t)sx * sz * sizeof(int));
    free(cache);
    return err;
}

EXPORT int biome_at(int dim, int x, int y, int z)
{
    return getBiomeAt(gen_for_dim(dim), 1, x, y, z);
}

/* Structures of `type` inside the block rectangle. Writes block positions (x, z) pairs to `out`
 * and returns how many were found (at most `max`). */
EXPORT int structures(int type, int x0, int z0, int x1, int z1, int *out, int max)
{
    StructureConfig sc;
    if (!getStructureConfig(type, cur_mc, &sc)) return 0;
    Generator *g = gen_for_dim(sc.dim);
    int size = sc.regionSize * 16;
    int rx0 = (int)((x0 >> 4) / (double)sc.regionSize) - 1;
    int rx1 = (int)((x1 >> 4) / (double)sc.regionSize) + 1;
    int rz0 = (int)((z0 >> 4) / (double)sc.regionSize) - 1;
    int rz1 = (int)((z1 >> 4) / (double)sc.regionSize) + 1;
    (void)size;
    int n = 0;
    for (int rz = rz0; rz <= rz1; rz++) {
        for (int rx = rx0; rx <= rx1; rx++) {
            Pos p;
            if (!getStructurePos(type, cur_mc, cur_seed, rx, rz, &p)) continue;
            if (p.x < x0 || p.x > x1 || p.z < z0 || p.z > z1) continue;
            if (!isViableStructurePos(type, g, p.x, p.z, 0)) continue;
            if (n >= max) return n;
            out[2 * n] = p.x;
            out[2 * n + 1] = p.z;
            n++;
        }
    }
    return n;
}

/* The first `count` strongholds, as (x, z) block pairs. */
EXPORT int strongholds(int count, int *out)
{
    StrongholdIter sh;
    initFirstStronghold(&sh, cur_mc, cur_seed);
    int n = 0;
    while (n < count && nextStronghold(&sh, &gens[0]) > 0) {
        out[2 * n] = sh.pos.x;
        out[2 * n + 1] = sh.pos.z;
        n++;
    }
    return n;
}

EXPORT void spawn(int *out)
{
    Pos p = getSpawn(&gens[0]);
    out[0] = p.x;
    out[1] = p.z;
}

/* Slime chunks of a chunk rectangle, one byte per chunk. */
EXPORT void slime_chunks(int cx, int cz, int w, int h, uint8_t *out)
{
    for (int j = 0; j < h; j++)
        for (int i = 0; i < w; i++)
            out[j * w + i] = (uint8_t)isSlimeChunk(cur_seed, cx + i, cz + j);
}

EXPORT void biome_colors(unsigned char *out)
{
    unsigned char colors[256][3];
    initBiomeColors(colors);
    memcpy(out, colors, sizeof(colors));
}

/* Name of a biome for the current version, pointer to a static string (NULL if unknown). */
/* Name of a biome, or NULL when the current version does not generate it (cubiomes names every id,
 * e.g. desert_hills in 1.21). Deep warm ocean was registered until 1.17 but never generated. */
EXPORT const char *biome_name(int id)
{
    if (!biomeExists(cur_mc, id) || id == deep_warm_ocean) return NULL;
    return biome2str(cur_mc, id);
}

EXPORT int structure_dim(int type)
{
    StructureConfig sc;
    return getStructureConfig(type, cur_mc, &sc) ? sc.dim : 1000;
}

/* Version constant from a name like "1.21" (see str2mc in cubiomes), or 0 when unknown. */
EXPORT int mc_id(const char *name) { return str2mc(name); }

/* Mineshafts are not region based, cubiomes finds them per chunk area. */
EXPORT int mineshafts(int x0, int z0, int x1, int z1, int *out, int max)
{
    int cx0 = x0 >> 4, cz0 = z0 >> 4, w = (x1 >> 4) - cx0 + 1, h = (z1 >> 4) - cz0 + 1;
    Pos *found = (Pos *)malloc(sizeof(Pos) * (size_t)max);
    int total = getMineshafts(cur_mc, cur_seed, cx0, cz0, w, h, found, max);
    int n = total < max ? total : max;
    for (int i = 0; i < n; i++) {
        out[2 * i] = found[i].x;
        out[2 * i + 1] = found[i].z;
    }
    free(found);
    return n;
}
