#include "algos/rect_union_3d.hpp"

namespace algos {

struct YInterval { double y1, y2; int delta; };

// 维护一维覆盖长度的线段树（用于 y 方向）
struct SegTree {
    struct Node { int cover=0; double len=0; };
    std::vector<Node> t; std::vector<double> ys;
    SegTree(const std::vector<double>& ys_): ys(ys_) {
        t.assign(ys.size()*4+5, {});
    }
    void upd(int p,int l,int r,int ql,int qr,int v){
        if(ql>=r || qr<=l) return;
        if(ql<=l && r<=qr){ t[p].cover+=v; pull(p,l,r); return; }
        int m=(l+r)>>1;
        upd(p<<1,l,m,ql,qr,v); upd(p<<1|1,m,r,ql,qr,v); pull(p,l,r);
    }
    void pull(int p,int l,int r){
        if(t[p].cover>0){ t[p].len = ys[r]-ys[l]; }
        else if(l+1==r){ t[p].len=0; }
        else { t[p].len = t[p<<1].len + t[p<<1|1].len; }
    }
};

double rect_union_volume_3d(const std::vector<Box3D>& boxes){
    if(boxes.empty()) return 0.0;
    struct Event { double x; double y1,y2; double z1,z2; int delta; };
    std::vector<Event> ev;
    for(auto &b: boxes){
        if(b.x1>=b.x2 || b.y1>=b.y2 || b.z1>=b.z2) continue;
        ev.push_back({b.x1,b.y1,b.y2,b.z1,b.z2,+1});
        ev.push_back({b.x2,b.y1,b.y2,b.z1,b.z2,-1});
    }
    if(ev.empty()) return 0.0;
    std::sort(ev.begin(), ev.end(), [](auto&a,auto&b){return a.x<b.x;});

    // 活跃 yz 矩形，使用计数避免完全重建
    struct YZ { double y1,y2,z1,z2; };
    struct KeyHash {
        size_t operator()(const YZ& k) const noexcept{
            auto h1 = std::hash<long long>{}((long long)std::llround(k.y1*1e6));
            auto h2 = std::hash<long long>{}((long long)std::llround(k.y2*1e6));
            auto h3 = std::hash<long long>{}((long long)std::llround(k.z1*1e6));
            auto h4 = std::hash<long long>{}((long long)std::llround(k.z2*1e6));
            return (((h1*1315423911u) ^ h2)*2654435761u) ^ (h3*97531u) ^ h4;
        }
    };
    struct KeyEq { bool operator()(const YZ&a,const YZ&b) const noexcept{
        return std::fabs(a.y1-b.y1)<1e-9 && std::fabs(a.y2-b.y2)<1e-9 && std::fabs(a.z1-b.z1)<1e-9 && std::fabs(a.z2-b.z2)<1e-9;
    }};
    std::unordered_map<YZ,int,KeyHash,KeyEq> active;

    auto areaYZ = [&](){
        // 将 active>0 的 yz 盒投影，用 z 扫描 + y 段树
        struct ZEvt{ double z; double y1,y2; int delta; };
        std::vector<ZEvt> zev; zev.reserve(active.size()*2);
        std::vector<double> ys; ys.reserve(active.size()*2);
        for(auto &kv: active){ if(kv.second<=0) continue; const auto &r=kv.first; zev.push_back({r.z1,r.y1,r.y2,+1}); zev.push_back({r.z2,r.y1,r.y2,-1}); ys.push_back(r.y1); ys.push_back(r.y2);}        
        if(zev.empty()) return 0.0;
        std::sort(ys.begin(), ys.end()); ys.erase(std::unique(ys.begin(), ys.end()), ys.end());
        if(ys.size()<2) return 0.0;
        std::sort(zev.begin(), zev.end(), [](auto&a,auto&b){return a.z<b.z;});
        SegTree st(ys);
        double area=0.0; for(size_t k=0;k<zev.size();){
            size_t k2=k; double z=zev[k].z; while(k2<zev.size() && std::fabs(zev[k2].z - z)<1e-12){
                int y1 = (int)(std::lower_bound(ys.begin(), ys.end(), zev[k2].y1)-ys.begin());
                int y2 = (int)(std::lower_bound(ys.begin(), ys.end(), zev[k2].y2)-ys.begin());
                st.upd(1,0,(int)ys.size()-1,y1,y2, zev[k2].delta);
                ++k2;
            }
            if(k2<zev.size()){
                double dz = zev[k2].z - z;
                area += st.t[1].len * dz;
            }
            k = k2;
        }
        return area;
    };

    double vol=0.0; size_t i=0; double curX = ev[0].x; // 初始化在第一个 x 之前无面积
    while(i<ev.size()){
        double x = ev[i].x;
        // 先结算到 x 的上一段（curX -> x）
        double area = areaYZ();
        vol += area * (x - curX);
        // 应用在 x 处的事件
        while(i<ev.size() && std::fabs(ev[i].x - x)<1e-12){
            YZ key{ev[i].y1,ev[i].y2,ev[i].z1,ev[i].z2};
            active[key] += ev[i].delta;
            i++;
        }
        curX = x;
    }
    // 末段不再累加（无右侧宽度）
    return vol;
}

} // namespace algos
