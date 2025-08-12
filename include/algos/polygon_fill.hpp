#pragma once
#include "types.hpp"

namespace algos {
// 多边形填充：返回扫描线在每一条 y 扫描线上得到的填充区间 [x1,x2)
// step: y 方向扫描步长（用于离散/演示）。
std::vector<std::pair<double,double>> polygon_fill_scanlines(const Polygon& poly, double y, double step, double& nextY);

} // namespace algos
