#pragma once
#include "types.hpp"

namespace algos {
// 天际线：输入建筑(left,right,height)，输出关键点轮廓 (x, height)
std::vector<std::pair<int,int>> skyline_outline(const std::vector<Building>& buildings);

} // namespace algos
