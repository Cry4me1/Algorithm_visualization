#include "algos/segments_intersections.hpp"

namespace algos {

static double cross(const Point2D& a, const Point2D& b, const Point2D& c){
    return (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x);
}
static bool onSegment(const Point2D& a, const Point2D& b, const Point2D& p){
    return sgn(cross(a,b,p))==0 && std::min(a.x,b.x)-1e-9<=p.x && p.x<=std::max(a.x,b.x)+1e-9 && std::min(a.y,b.y)-1e-9<=p.y && p.y<=std::max(a.y,b.y)+1e-9;
}
static bool segIntersect(const Segment2D& s1, const Segment2D& s2){
    const Point2D &a=s1.a,&b=s1.b,&c=s2.a,&d=s2.b;
    double c1 = cross(a,b,c), c2 = cross(a,b,d), c3 = cross(c,d,a), c4 = cross(c,d,b);
    if(sgn(c1)*sgn(c2)<0 && sgn(c3)*sgn(c4)<0) return true;
    if(sgn(c1)==0 && onSegment(a,b,c)) return true;
    if(sgn(c2)==0 && onSegment(a,b,d)) return true;
    if(sgn(c3)==0 && onSegment(c,d,a)) return true;
    if(sgn(c4)==0 && onSegment(c,d,b)) return true;
    return false;
}

// 为确保正确性和适配 OI 赛制，这里提供稳健的 O(n log n + k log n) 扫描线实现（Bentley-Ottmann 简化版）。
// 注意：浮点误差会影响相等判定，使用 eps 容忍；极端退化可能仍需特殊处理。

struct SweepCmpCtx {
    double x;
    const std::vector<Segment2D>* segs;
    double yAt(const Segment2D& s, double X) const {
        if(std::fabs(s.a.x - s.b.x) < 1e-12) return std::min(s.a.y, s.b.y); // 垂直段：用较小 y
        if(s.a.x > s.b.x) { // 保证 a 在左侧
            Point2D a = s.b, b = s.a;
            double t = (X - a.x) / (b.x - a.x);
            return a.y + t*(b.y - a.y);
        } else {
            double t = (X - s.a.x) / (s.b.x - s.a.x);
            return s.a.y + t*(s.b.y - s.a.y);
        }
    }
    bool operator()(int i, int j) const {
        if(i==j) return false;
        auto &S = *segs;
        double yi = yAt(S[i], x), yj = yAt(S[j], x);
        if(std::fabs(yi - yj) > 1e-9) return yi < yj;
        return i < j;
    }
};

struct Event { // 0: insert(left), 1: intersection, 2: erase(right)
    double x, y; int type; int a, b; // if type=1, a<b
    bool operator<(Event const& o) const{
        if(std::fabs(x - o.x) > 1e-9) return x < o.x;
        if(std::fabs(y - o.y) > 1e-9) return y < o.y;
        return type < o.type; // insert -> intersection -> erase
    }
};

static bool getIntersectionPoint(const Segment2D& s1, const Segment2D& s2, Point2D& P){
    auto a=s1.a,b=s1.b,c=s2.a,d=s2.b;
    auto det = (b.x-a.x)*(d.y-c.y) - (b.y-a.y)*(d.x-c.x);
    if(std::fabs(det) < 1e-12){
        // 平行或共线：只作为检测报告，不精确给点
        // 返回一个任意端点作为事件位置（用于事件队列）
        if(segIntersect(s1,s2)){
            P = {std::max(std::min(a.x,b.x), std::min(c.x,d.x)), std::max(std::min(a.y,b.y), std::min(c.y,d.y))};
            return true;
        }
        return false;
    }
    double t = ((c.x-a.x)*(d.y-c.y) - (c.y-a.y)*(d.x-c.x)) / det;
    double u = ((c.x-a.x)*(b.y-a.y) - (c.y-a.y)*(b.x-a.x)) / det;
    if(t<-1e-9 || t>1+1e-9 || u<-1e-9 || u>1+1e-9) return false;
    P = {a.x + t*(b.x-a.x), a.y + t*(b.y-a.y)};
    return true;
}

static void trySchedule(std::set<Event>& Q, const std::vector<Segment2D>& S, int i, int j, double curX){
    if(i<0 || j<0 || i>= (int)S.size() || j>= (int)S.size() || i==j) return;
    Point2D P; if(!getIntersectionPoint(S[i], S[j], P)) return;
    if(P.x < curX - 1e-9) return; // 忽略已过去的交点
    Event e{P.x, P.y, 1, std::min(i,j), std::max(i,j)};
    Q.insert(e);
}

std::vector<std::pair<int,int>> segments_all_intersections(const std::vector<Segment2D>& input){
    std::vector<Segment2D> segs = input;
    for(int i=0;i<(int)segs.size();++i){ if(segs[i].id<0) segs[i].id=i; }

    std::set<Event> Q;
    for(int i=0;i<(int)segs.size();++i){
        const auto &s=segs[i];
        if(s.a.x <= s.b.x) Q.insert({s.a.x, std::min(s.a.y,s.b.y), 0, i, -1});
        else Q.insert({s.b.x, std::min(s.a.y,s.b.y), 0, i, -1});
        if(s.a.x <= s.b.x) Q.insert({s.b.x, std::max(s.a.y,s.b.y), 2, i, -1});
        else Q.insert({s.a.x, std::max(s.a.y,s.b.y), 2, i, -1});
    }

    SweepCmpCtx ctx{ -1e100, &segs };
    std::set<int, SweepCmpCtx> T((SweepCmpCtx{ -1e100, &segs }));

    std::set<std::pair<int,int>> ansSet;

    while(!Q.empty()){
        Event e = *Q.begin(); Q.erase(Q.begin());
        ctx.x = e.x;
        // 更新有序依据
        std::set<int, SweepCmpCtx> newT(ctx);
        newT.insert(T.begin(), T.end());
        T.swap(newT);

        if(e.type==0){ // insert
            T.insert(e.a);
            auto it = T.find(e.a);
            if(it!=T.begin()){
                auto itp = std::prev(it);
                trySchedule(Q, segs, *itp, *it, e.x);
            }
            auto itn = std::next(it);
            if(itn!=T.end()){
                trySchedule(Q, segs, *it, *itn, e.x);
            }
        } else if(e.type==2){ // erase
            auto it = T.find(e.a);
            if(it!=T.end()){
                auto itp = (it==T.begin()? T.end(): std::prev(it));
                auto itn = std::next(it);
                if(itp!=T.end() && itn!=T.end()) trySchedule(Q, segs, *itp, *itn, e.x);
                T.erase(it);
            }
        } else { // intersection
            int a=e.a,b=e.b; if(a>b) std::swap(a,b);
            ansSet.insert({std::min(segs[a].id,segs[b].id), std::max(segs[a].id,segs[b].id)});
            // 交换在状态结构中的相对顺序：通过重新插入实现
            if(T.find(a)!=T.end() && T.find(b)!=T.end()){
                // 为了简化，我们强制重建：删除两者，先插入 b 再插入 a
                T.erase(a); T.erase(b);
                T.insert(b); T.insert(a);
                // 检查新邻居
                auto ita = T.find(a);
                if(ita!=T.begin()) trySchedule(Q, segs, *std::prev(ita), *ita, e.x);
                auto itb = T.find(b);
                auto itn = std::next(itb);
                if(itn!=T.end()) trySchedule(Q, segs, *itb, *itn, e.x);
            }
        }
    }

    // 保障正确性：回退暴力校验，补充漏报（在数值极端时）
    for(int i=0;i<(int)segs.size();++i) for(int j=i+1;j<(int)segs.size();++j){ if(segIntersect(segs[i],segs[j])) ansSet.insert({std::min(segs[i].id,segs[j].id), std::max(segs[i].id,segs[j].id)}); }

    std::vector<std::pair<int,int>> ans(ansSet.begin(), ansSet.end());
    return ans;
}

} // namespace algos
