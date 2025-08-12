#include "algos/polygon_fill.hpp"

namespace algos {

// 返回在给定 y 扫描线上，简单多边形的交点 x 序列，组成 [x1,x2), [x3,x4) ...
std::vector<std::pair<double,double>> polygon_fill_scanlines(const Polygon& poly, double y, double step, double& nextY){
    nextY = y + step;
    const auto &P = poly.pts; int n=P.size();
    std::vector<double> xs; xs.reserve(n);
    for(int i=0;i<n;i++){
        auto a=P[i], b=P[(i+1)%n];
        if(a.y==b.y) continue; // 与扫描线平行不计
        if(a.y>b.y) std::swap(a,b);
        if(y < a.y || y >= b.y) continue; // 半开半闭，避免重计顶点
        double t = (y - a.y) / (b.y - a.y);
        double x = a.x + t*(b.x - a.x);
        xs.push_back(x);
    }
    std::sort(xs.begin(), xs.end());
    std::vector<std::pair<double,double>> spans;
    for(size_t i=0;i+1<xs.size(); i+=2){
        spans.emplace_back(xs[i], xs[i+1]);
    }
    return spans;
}

} // namespace algos
