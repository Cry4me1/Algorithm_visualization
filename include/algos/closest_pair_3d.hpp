#pragma once
#include "types.hpp"

namespace algos {
// 最近点对（3D）：返回最小距离与点对索引（返回下标对 i,j）
struct ClosestPair3DResult {
    double dist;
    int i, j;
};

ClosestPair3DResult closest_pair_3d(const std::vector<Point3D>& pts);

} // namespace algos
