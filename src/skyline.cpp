#include "algos/skyline.hpp"

namespace algos {

std::vector<std::pair<int,int>> skyline_outline(const std::vector<Building>& buildings){
    struct Event{int x; int h; int type;}; // type: 1 enter, -1 leave
    std::vector<Event> ev; ev.reserve(buildings.size()*2);
    for(auto &b: buildings){ if(b.left<b.right && b.height>0){ ev.push_back({b.left,b.height,1}); ev.push_back({b.right,b.height,-1}); } }
    std::sort(ev.begin(), ev.end(), [](const Event&a,const Event&b){ if(a.x!=b.x) return a.x<b.x; if(a.type!=b.type) return a.type>b.type; return a.h>b.h; });

    std::multiset<int> H; H.insert(0); int prevH=0; std::vector<std::pair<int,int>> res;
    for(size_t i=0;i<ev.size();){
        int x=ev[i].x;
        while(i<ev.size() && ev[i].x==x){
            if(ev[i].type==1) H.insert(ev[i].h); else { auto it=H.find(ev[i].h); if(it!=H.end()) H.erase(it); }
            ++i;
        }
        int curH = *H.rbegin();
        if(res.empty() || curH!=prevH){ res.push_back({x, curH}); prevH=curH; }
    }
    return res;
}

} // namespace algos
