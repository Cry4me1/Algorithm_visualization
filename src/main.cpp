#include <bits/stdc++.h>
#include "algos/types.hpp"
#include "algos/rect_union_3d.hpp"
#include "algos/segments_intersections.hpp"
#include "algos/polygon_fill.hpp"
#include "algos/closest_pair_3d.hpp"
#include "algos/skyline.hpp"

using namespace std;
using namespace algos;

int main(){
    ios::sync_with_stdio(false); cin.tie(nullptr);
    // 简单 demo：从 stdin 读取一个命令，跑对应算法
    // 命令：
    // vol3d n (then n lines: x1 y1 z1 x2 y2 z2)
    // segint m (then m lines: x1 y1 x2 y2)
    // polyfill k y step (then k lines: x y)
    // cp3d n (then n lines: x y z)
    // skyline n (then n lines: l r h)

    string cmd; if(!(cin>>cmd)){
        cerr << "Usage: vol3d|segint|polyfill|cp3d|skyline\n";
        return 0;
    }
    if(cmd=="vol3d"){
        int n; cin>>n; vector<Box3D> b(n); for(int i=0;i<n;++i) cin>>b[i].x1>>b[i].y1>>b[i].z1>>b[i].x2>>b[i].y2>>b[i].z2; 
        cout.setf(std::ios::fixed); cout<<setprecision(6)<<rect_union_volume_3d(b)<<"\n";
    } else if(cmd=="segint"){
        int m; cin>>m; vector<Segment2D> s(m); for(int i=0;i<m;++i){cin>>s[i].a.x>>s[i].a.y>>s[i].b.x>>s[i].b.y; s[i].id=i;} 
        auto ans = segments_all_intersections(s); cout<<ans.size()<<"\n"; for(auto &p: ans) cout<<p.first<<" "<<p.second<<"\n";
    } else if(cmd=="polyfill"){
        int k; double y, step; cin>>k>>y>>step; Polygon P; P.pts.resize(k); for(int i=0;i<k;++i) cin>>P.pts[i].x>>P.pts[i].y;
        double nextY; auto spans = polygon_fill_scanlines(P, y, step, nextY); cout<<spans.size()<<"\n"; 
        cout.setf(std::ios::fixed); cout<<setprecision(6);
        for(auto &sp: spans) cout<<sp.first<<" "<<sp.second<<"\n"; cout<<nextY<<"\n";
    } else if(cmd=="cp3d"){
        int n; cin>>n; vector<Point3D> pts(n); for(int i=0;i<n;++i) cin>>pts[i].x>>pts[i].y>>pts[i].z; auto r=closest_pair_3d(pts); cout.setf(std::ios::fixed); cout<<setprecision(6)<<r.dist<<" "<<r.i<<" "<<r.j<<"\n";
    } else if(cmd=="skyline"){
        int n; cin>>n; vector<Building> bs(n); for(int i=0;i<n;++i) cin>>bs[i].left>>bs[i].right>>bs[i].height; auto out=skyline_outline(bs); cout<<out.size()<<"\n"; for(auto &k: out) cout<<k.first<<" "<<k.second<<"\n";
    } else {
        cerr << "Unknown cmd\n";
    }
    return 0;
}
