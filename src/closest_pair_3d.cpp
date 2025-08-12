#include "algos/closest_pair_3d.hpp"

namespace algos {

static double dist2(const Point3D& a, const Point3D& b){
    double dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z; return dx*dx+dy*dy+dz*dz; }

struct WithIdx { Point3D p; int idx; };

static ClosestPair3DResult brute(const std::vector<WithIdx>& pts){
    ClosestPair3DResult r{std::numeric_limits<double>::infinity(), -1, -1};
    for(int i=0;i<(int)pts.size();++i) for(int j=i+1;j<(int)pts.size();++j){
        double d=dist2(pts[i].p,pts[j].p); if(d<r.dist*r.dist){ r={std::sqrt(d),pts[i].idx,pts[j].idx}; }
    }
    return r;
}

// 分治：按 x 排序，递归求解 + 跨带检查（在 3D 中，带内点可能较多，使用 kd-like 筛选 + 邻域网格近似）

static ClosestPair3DResult solve(std::vector<WithIdx>& pts){
    int n=pts.size(); if(n<=40) return brute(pts);
    int m=n/2; double midx=pts[m].p.x;
    std::vector<WithIdx> L(pts.begin(), pts.begin()+m), R(pts.begin()+m, pts.end());
    auto rl = solve(L); auto rr = solve(R);
    ClosestPair3DResult best = (rl.dist < rr.dist? rl: rr);
    double d = best.dist;

    // 跨带：|x - midx| <= d
    std::vector<WithIdx> band; band.reserve(n);
    for(int i=0;i<n;++i){ if(std::fabs(pts[i].p.x - midx) <= d) band.push_back(pts[i]); }
    std::sort(band.begin(), band.end(), [](auto&a,auto&b){return a.p.y<b.p.y;});

    // 粗网格：格长 d，哈希桶减少比较
    auto key = [d](const Point3D& p){
        long long gx = (long long)std::floor(p.x/std::max(d,1e-12));
        long long gy = (long long)std::floor(p.y/std::max(d,1e-12));
        long long gz = (long long)std::floor(p.z/std::max(d,1e-12));
        return std::tuple<long long,long long,long long>(gx,gy,gz);
    };
    std::unordered_map<long long, std::vector<WithIdx>> buckets;
    buckets.reserve(band.size()*2+1);
    auto hash3 = [](long long x,long long y,long long z){ return (x*1315423911LL) ^ (y*2654435761LL) ^ (z*97531LL); };

    auto put = [&](const WithIdx& e){
        auto [gx,gy,gz] = key(e.p);
        long long h = hash3(gx,gy,gz);
        buckets[h].push_back(e);
    };

    auto probe = [&](const WithIdx& cur){
        auto [gx,gy,gz] = key(cur.p);
        ClosestPair3DResult bestLocal{best.dist,best.i,best.j};
        for(long long dx=-1; dx<=1; ++dx) for(long long dy=-1; dy<=1; ++dy) for(long long dz=-1; dz<=1; ++dz){
            long long h = hash3(gx+dx,gy+dy,gz+dz);
            auto it = buckets.find(h); if(it==buckets.end()) continue;
            for(auto &q: it->second){ if(q.idx==cur.idx) continue; double d2v = dist2(cur.p, q.p); double dval = std::sqrt(d2v); if(dval < bestLocal.dist){ bestLocal.dist=dval; bestLocal.i=cur.idx; bestLocal.j=q.idx; } }
        }
        return bestLocal;
    };

    for(auto &e: band){
        auto cand = probe(e);
        if(cand.dist < best.dist) best = cand;
        put(e);
    }
    return best;
}

ClosestPair3DResult closest_pair_3d(const std::vector<Point3D>& in){
    if(in.size()<2) return {std::numeric_limits<double>::infinity(), -1, -1};
    std::vector<WithIdx> pts; pts.reserve(in.size());
    for(int i=0;i<(int)in.size();++i) pts.push_back({in[i], i});
    std::sort(pts.begin(), pts.end(), [](auto&a,auto&b){return a.p.x<b.p.x;});
    return solve(pts);
}

} // namespace algos
