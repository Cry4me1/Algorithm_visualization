#pragma once
#include "types.hpp"

namespace algos {
// 3D 体积并（轴对齐长方体）接口
// 输入：多个 Box3D（可重叠）
// 输出：总体积（double）

double rect_union_volume_3d(const std::vector<Box3D>& boxes);

} // namespace algos
