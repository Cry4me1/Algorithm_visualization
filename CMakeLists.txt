cmake_minimum_required(VERSION 3.16)
project(algo_vis CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(algos
    src/rect_union_3d.cpp
    src/segments_intersections.cpp
    src/polygon_fill.cpp
    src/closest_pair_3d.cpp
    src/skyline.cpp
)

target_include_directories(algos PUBLIC include)

add_executable(algo_vis src/main.cpp)
target_link_libraries(algo_vis PRIVATE algos)
