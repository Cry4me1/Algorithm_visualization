# Algorithm Visualization (C++ + Web)

本项目实现并可视化以下算法（二维/三维扫描线与相关经典计算几何问题）：

- 矩形体积并（3D）：计算多个轴对齐长方体（AABB）的总体积（扫描线 + 线段树/覆盖长度）
- 线段相交检测（2D）：扫描线检测所有相交线段对
- 多边形填充（2D）：扫描线填充（Even-Odd/Winding）
- 最近点对问题（3D）：分治法/空间划分
- 天际线问题（2D）：建筑物轮廓（扫描线）

并提供一个 Web 可视化（HTML/CSS/JS）演示算法流程与动画。

## 结构

```
include/algos/   # 头文件
src/             # C++ 实现与可执行入口
web/             # 前端可视化
tests/           # 简单单元/样例
```

## 构建

使用 CMake（跨平台），Windows/PowerShell 示例：

```
mkdir build; cd build
cmake -G "MinGW Makefiles" ..
cmake --build . --config Release
.\n```

或使用 MSVC：

```
mkdir build; cd build
cmake -G "Visual Studio 17 2022" ..
cmake --build . --config Release
```

生成的可执行为 `algo_vis`。

## 运行

```
./algo_vis
```

## Web 可视化

直接打开 `web/index.html`（需本地文件权限）。

