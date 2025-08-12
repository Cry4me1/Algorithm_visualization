#pragma once
#include "types.hpp"

namespace algos {
// 2D 线段相交：返回所有相交的线段对的 id（有序对 id1 < id2）
std::vector<std::pair<int,int>> segments_all_intersections(const std::vector<Segment2D>& segs);

} // namespace algos
