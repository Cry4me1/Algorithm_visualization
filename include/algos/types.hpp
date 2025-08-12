#pragma once
#include <bits/stdc++.h>

namespace algos {

struct Point2D {
    double x{}, y{};
};

struct Segment2D {
    Point2D a, b;
    int id{-1};
};

struct Point3D {
    double x{}, y{}, z{};
};

struct Box3D { // Axis-aligned box [x1,x2) x [y1,y2) x [z1,z2)
    double x1{}, y1{}, z1{};
    double x2{}, y2{}, z2{};
};

struct Polygon {
    std::vector<Point2D> pts; // simple polygon (can be non-convex)
};

struct Building { // for skyline
    int left;
    int right;
    int height;
};

inline int sgn(double v, double eps=1e-9){ return (v>eps)-(v<-eps); }

} // namespace algos
