/**
 * 三维扫描线算法可视化 - 新的完整实现
 */

// 简单的 Vector3 数学库
const Vec3 = {
  create: (x = 0, y = 0, z = 0) => ({ x, y, z }),
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
  length: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  normalize: (v) => {
    const len = Vec3.length(v);
    return len > 0 ? Vec3.mul(v, 1 / len) : Vec3.create();
  }
};

// 主要的可视化类
class AlgorithmVisualizer {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // 状态
    this.algorithm = 'rect3d';
    this.animating = false;
    this.currentStep = 0;
    this.totalSteps = 100;
    this.mode = '3d'; // '3d' 或 '2d'
    
    // 3D 相机
    this.camera = {
      position: Vec3.create(8, 6, 10),
      target: Vec3.create(0, 0, 0),
      rotation: { pitch: 0, yaw: 0 }
    };
    
    // 数据对象
    this.boxes3d = [];
    this.segments2d = [];
    this.polygons2d = [];
    this.points3d = [];
    
    // 扫描线状态
    this.scanPlane = { x: -5, visible: false };
    this.scanLine2D = { x: 0, y: 0, visible: false, direction: 'x' };
    
    // 视图设置
    this.showGrid = true;
    this.showAxes = true;
    this.scale2D = 50;
    this.offset2D = { x: 0, y: 0 };
    
    this.initializeData();
    this.setupEventListeners();
    this.setupControlListeners();
    this.render();
  }
  
  initializeData() {
    // 默认 3D 盒子
    this.boxes3d = [
      { min: Vec3.create(-2, -1, -1), max: Vec3.create(1, 2, 2), color: '#ef4444' },
      { min: Vec3.create(-0.5, -0.5, -0.5), max: Vec3.create(3, 1.5, 1.5), color: '#3b82f6' },
      { min: Vec3.create(1, 0, 0), max: Vec3.create(4, 3, 3), color: '#10b981' }
    ];
    
    // 默认 2D 线段
    this.segments2d = [
      { start: Vec3.create(-3, -2, 0), end: Vec3.create(3, 2, 0), color: '#ef4444' },
      { start: Vec3.create(-3, 2, 0), end: Vec3.create(3, -2, 0), color: '#3b82f6' },
      { start: Vec3.create(-1, -3, 0), end: Vec3.create(1, 3, 0), color: '#10b981' },
      { start: Vec3.create(-2, 0, 0), end: Vec3.create(2, 0, 0), color: '#f59e0b' }
    ];
    
    // 默认多边形
    this.polygons2d = [{
      points: [
        Vec3.create(-2, -1, 0),
        Vec3.create(2, -1, 0),
        Vec3.create(1.5, 1, 0),
        Vec3.create(0, 2, 0),
        Vec3.create(-1.5, 1, 0)
      ],
      color: '#8b5cf6',
      filled: false
    }];
  }
  
  setupEventListeners() {
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      
      if (this.mode === '3d') {
        this.rotateCamera(deltaX, deltaY);
      } else {
        this.pan2D(deltaX, deltaY);
      }
      
      lastMouse = { x: e.clientX, y: e.clientY };
      this.render();
    });
    
    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.mode === '3d') {
        this.zoomCamera(e.deltaY);
      } else {
        this.zoom2D(e.deltaY);
      }
      this.render();
    });
  }
  
  setupControlListeners() {
    // 算法选择
    document.getElementById('algorithm-select').addEventListener('change', (e) => {
      this.switchAlgorithm(e.target.value);
    });
    
    // 时间轴控制
    document.getElementById('play-pause').addEventListener('click', () => {
      this.toggleAnimation();
    });
    
    document.getElementById('step-forward').addEventListener('click', () => {
      this.stepForward();
    });
    
    document.getElementById('step-backward').addEventListener('click', () => {
      this.stepBackward();
    });
    
    // 视图控制
    document.getElementById('view-reset').addEventListener('click', () => {
      this.resetView();
    });
    
    document.getElementById('view-grid').addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.render();
    });
    
    document.getElementById('view-slice').addEventListener('click', () => {
      this.toggleScanPlane();
    });
    
    // 背景色
    document.getElementById('bg-color').addEventListener('change', () => {
      this.render();
    });
    
    // 时间轴滑块
    document.getElementById('timeline-slider').addEventListener('input', (e) => {
      if (!this.animating) {
        this.setAnimationProgress(e.target.value / 100);
      }
    });
  }
  
  rotateCamera(deltaX, deltaY) {
    const sensitivity = 0.01;
    this.camera.rotation.yaw += deltaX * sensitivity;
    this.camera.rotation.pitch += deltaY * sensitivity;
    this.camera.rotation.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.camera.rotation.pitch));
    
    const distance = Vec3.length(Vec3.sub(this.camera.position, this.camera.target));
    this.camera.position = Vec3.add(this.camera.target, Vec3.create(
      Math.cos(this.camera.rotation.pitch) * Math.sin(this.camera.rotation.yaw) * distance,
      Math.sin(this.camera.rotation.pitch) * distance,
      Math.cos(this.camera.rotation.pitch) * Math.cos(this.camera.rotation.yaw) * distance
    ));
  }
  
  zoomCamera(delta) {
    const factor = delta > 0 ? 0.9 : 1.1;
    const direction = Vec3.sub(this.camera.position, this.camera.target);
    this.camera.position = Vec3.add(this.camera.target, Vec3.mul(direction, factor));
  }
  
  pan2D(deltaX, deltaY) {
    this.offset2D.x += deltaX;
    this.offset2D.y += deltaY;
  }
  
  zoom2D(delta) {
    const factor = delta > 0 ? 0.9 : 1.1;
    this.scale2D *= factor;
    this.scale2D = Math.max(10, Math.min(200, this.scale2D));
  }
  
  project3D(point) {
    // 简化的投影
    const view = Vec3.sub(point, this.camera.target);
    const distance = Vec3.length(Vec3.sub(this.camera.position, this.camera.target));
    
    if (view.z > distance - 1) return null;
    
    const perspective = distance / Math.max(0.1, distance - view.z);
    const x = (view.x * perspective * 50) + this.canvas.width / 2;
    const y = (-view.y * perspective * 50) + this.canvas.height / 2;
    
    return { x, y };
  }
  
  to2DScreen(point) {
    const centerX = this.canvas.width / 2 + this.offset2D.x;
    const centerY = this.canvas.height / 2 + this.offset2D.y;
    
    return {
      x: centerX + point.x * this.scale2D,
      y: centerY - point.y * this.scale2D
    };
  }
  
  render() {
    // 清除画布
    const bgColor = document.getElementById('bg-color').value;
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制网格
    if (this.showGrid) {
      this.drawGrid();
    }
    
    // 绘制坐标轴
    if (this.showAxes) {
      this.drawAxes();
    }
    
    // 根据算法绘制内容
    switch (this.algorithm) {
      case 'rect3d':
        this.render3DBoxes();
        break;
      case 'segint':
        this.render2DSegments();
        break;
      case 'polyfill':
        this.render2DPolygons();
        break;
      case 'cp3d':
        this.render3DPoints();
        break;
      case 'skyline':
        this.render2DSkyline();
        break;
    }
    
    this.updateInfo();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    if (this.mode === '3d') {
      // 3D 网格
      for (let i = -10; i <= 10; i++) {
        const p1 = this.project3D(Vec3.create(i, 0, -10));
        const p2 = this.project3D(Vec3.create(i, 0, 10));
        const p3 = this.project3D(Vec3.create(-10, 0, i));
        const p4 = this.project3D(Vec3.create(10, 0, i));
        
        if (p1 && p2) {
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
        
        if (p3 && p4) {
          this.ctx.beginPath();
          this.ctx.moveTo(p3.x, p3.y);
          this.ctx.lineTo(p4.x, p4.y);
          this.ctx.stroke();
        }
      }
    } else {
      // 2D 网格
      const step = this.scale2D;
      const centerX = this.canvas.width / 2 + this.offset2D.x;
      const centerY = this.canvas.height / 2 + this.offset2D.y;
      
      for (let i = -20; i <= 20; i++) {
        // 垂直线
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + i * step, 0);
        this.ctx.lineTo(centerX + i * step, this.canvas.height);
        this.ctx.stroke();
        
        // 水平线
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY + i * step);
        this.ctx.lineTo(this.canvas.width, centerY + i * step);
        this.ctx.stroke();
      }
    }
  }
  
  drawAxes() {
    if (this.mode === '3d') {
      const origin = this.project3D(Vec3.create(0, 0, 0));
      if (!origin) return;
      
      // X 轴 - 红色
      const xAxis = this.project3D(Vec3.create(3, 0, 0));
      if (xAxis) {
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(xAxis.x, xAxis.y);
        this.ctx.stroke();
      }
      
      // Y 轴 - 绿色
      const yAxis = this.project3D(Vec3.create(0, 3, 0));
      if (yAxis) {
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(yAxis.x, yAxis.y);
        this.ctx.stroke();
      }
      
      // Z 轴 - 蓝色
      const zAxis = this.project3D(Vec3.create(0, 0, 3));
      if (zAxis) {
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(zAxis.x, zAxis.y);
        this.ctx.stroke();
      }
    } else {
      const centerX = this.canvas.width / 2 + this.offset2D.x;
      const centerY = this.canvas.height / 2 + this.offset2D.y;
      
      // X 轴
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, centerY);
      this.ctx.lineTo(this.canvas.width, centerY);
      this.ctx.stroke();
      
      // Y 轴
      this.ctx.strokeStyle = '#10b981';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, 0);
      this.ctx.lineTo(centerX, this.canvas.height);
      this.ctx.stroke();
    }
  }
  
  render3DBoxes() {
    this.mode = '3d';
    
    // 绘制扫描平面
    if (this.scanPlane.visible) {
      this.drawScanPlane();
    }
    
    // 绘制盒子
    this.boxes3d.forEach(box => {
      this.drawBox3D(box);
    });
  }
  
  drawScanPlane() {
    const x = this.scanPlane.x;
    const size = 6;
    
    const corners = [
      this.project3D(Vec3.create(x, -size, -size)),
      this.project3D(Vec3.create(x, size, -size)),
      this.project3D(Vec3.create(x, size, size)),
      this.project3D(Vec3.create(x, -size, size))
    ].filter(p => p !== null);
    
    if (corners.length === 4) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      this.ctx.beginPath();
      this.ctx.moveTo(corners[0].x, corners[0].y);
      corners.forEach(corner => this.ctx.lineTo(corner.x, corner.y));
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }
  
  drawBox3D(box) {
    // 计算8个顶点
    const vertices = [
      Vec3.create(box.min.x, box.min.y, box.min.z),
      Vec3.create(box.max.x, box.min.y, box.min.z),
      Vec3.create(box.max.x, box.max.y, box.min.z),
      Vec3.create(box.min.x, box.max.y, box.min.z),
      Vec3.create(box.min.x, box.min.y, box.max.z),
      Vec3.create(box.max.x, box.min.y, box.max.z),
      Vec3.create(box.max.x, box.max.y, box.max.z),
      Vec3.create(box.min.x, box.max.y, box.max.z)
    ];
    
    const projectedVertices = vertices.map(v => this.project3D(v)).filter(p => p !== null);
    if (projectedVertices.length < 8) return;
    
    // 绘制面（简化）
    this.ctx.fillStyle = box.color + '66';
    this.ctx.strokeStyle = box.color;
    this.ctx.lineWidth = 1;
    
    // 底面
    this.ctx.beginPath();
    this.ctx.moveTo(projectedVertices[0].x, projectedVertices[0].y);
    this.ctx.lineTo(projectedVertices[1].x, projectedVertices[1].y);
    this.ctx.lineTo(projectedVertices[2].x, projectedVertices[2].y);
    this.ctx.lineTo(projectedVertices[3].x, projectedVertices[3].y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 顶面
    this.ctx.beginPath();
    this.ctx.moveTo(projectedVertices[4].x, projectedVertices[4].y);
    this.ctx.lineTo(projectedVertices[5].x, projectedVertices[5].y);
    this.ctx.lineTo(projectedVertices[6].x, projectedVertices[6].y);
    this.ctx.lineTo(projectedVertices[7].x, projectedVertices[7].y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 垂直边
    const edges = [[0,4], [1,5], [2,6], [3,7]];
    edges.forEach(([start, end]) => {
      this.ctx.beginPath();
      this.ctx.moveTo(projectedVertices[start].x, projectedVertices[start].y);
      this.ctx.lineTo(projectedVertices[end].x, projectedVertices[end].y);
      this.ctx.stroke();
    });
    
    // 高亮与扫描平面相交的盒子
    if (this.scanPlane.visible && 
        box.min.x <= this.scanPlane.x && 
        box.max.x >= this.scanPlane.x) {
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 3;
      
      // 重新绘制边框
      this.ctx.beginPath();
      this.ctx.moveTo(projectedVertices[0].x, projectedVertices[0].y);
      this.ctx.lineTo(projectedVertices[1].x, projectedVertices[1].y);
      this.ctx.lineTo(projectedVertices[2].x, projectedVertices[2].y);
      this.ctx.lineTo(projectedVertices[3].x, projectedVertices[3].y);
      this.ctx.closePath();
      this.ctx.stroke();
      
      edges.forEach(([start, end]) => {
        this.ctx.beginPath();
        this.ctx.moveTo(projectedVertices[start].x, projectedVertices[start].y);
        this.ctx.lineTo(projectedVertices[end].x, projectedVertices[end].y);
        this.ctx.stroke();
      });
    }
  }
  
  render2DSegments() {
    this.mode = '2d';
    
    // 绘制扫描线
    if (this.scanLine2D.visible) {
      this.drawScanLine2D();
    }
    
    // 绘制线段
    this.segments2d.forEach(segment => {
      this.drawSegment2D(segment);
    });
    
    // 绘制交点
    this.drawIntersections();
  }
  
  drawScanLine2D() {
    this.ctx.strokeStyle = '#fbbf24';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    
    if (this.scanLine2D.direction === 'x') {
      const pos = this.to2DScreen(Vec3.create(this.scanLine2D.x, 0, 0));
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, 0);
      this.ctx.lineTo(pos.x, this.canvas.height);
      this.ctx.stroke();
    } else {
      const pos = this.to2DScreen(Vec3.create(0, this.scanLine2D.y, 0));
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos.y);
      this.ctx.lineTo(this.canvas.width, pos.y);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }
  
  drawSegment2D(segment) {
    const start = this.to2DScreen(segment.start);
    const end = this.to2DScreen(segment.end);
    
    this.ctx.strokeStyle = segment.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    // 绘制端点
    this.ctx.fillStyle = segment.color;
    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawIntersections() {
    const intersections = [];
    
    // 暴力查找所有交点
    for (let i = 0; i < this.segments2d.length; i++) {
      for (let j = i + 1; j < this.segments2d.length; j++) {
        const intersection = this.getSegmentIntersection(this.segments2d[i], this.segments2d[j]);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
    
    // 绘制交点
    this.ctx.fillStyle = '#ef4444';
    intersections.forEach(point => {
      const pos = this.to2DScreen(point);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  getSegmentIntersection(seg1, seg2) {
    const p1 = seg1.start, p2 = seg1.end;
    const p3 = seg2.start, p4 = seg2.end;
    
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-10) return null;
    
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return Vec3.create(
        p1.x + t * (p2.x - p1.x),
        p1.y + t * (p2.y - p1.y),
        0
      );
    }
    
    return null;
  }
  
  render2DPolygons() {
    this.mode = '2d';
    
    // 绘制扫描线
    if (this.scanLine2D.visible) {
      this.drawScanLine2D();
    }
    
    // 绘制多边形
    this.polygons2d.forEach(polygon => {
      this.drawPolygon2D(polygon);
    });
  }
  
  drawPolygon2D(polygon) {
    // 绘制多边形边框
    this.ctx.strokeStyle = polygon.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    const firstPoint = this.to2DScreen(polygon.points[0]);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < polygon.points.length; i++) {
      const point = this.to2DScreen(polygon.points[i]);
      this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    // 如果启用了填充且扫描线可见，绘制填充区域
    if (polygon.filled && this.scanLine2D.visible && this.scanLine2D.direction === 'y') {
      this.fillPolygonAtScanline(polygon, this.scanLine2D.y);
    }
  }
  
  fillPolygonAtScanline(polygon, y) {
    const intersections = [];
    const n = polygon.points.length;
    
    // 计算与扫描线的交点
    for (let i = 0; i < n; i++) {
      const p1 = polygon.points[i];
      const p2 = polygon.points[(i + 1) % n];
      
      if (p1.y === p2.y) continue; // 水平边
      
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      
      if (y >= minY && y < maxY) {
        const t = (y - p1.y) / (p2.y - p1.y);
        const x = p1.x + t * (p2.x - p1.x);
        intersections.push(x);
      }
    }
    
    intersections.sort((a, b) => a - b);
    
    // 绘制填充区域
    this.ctx.fillStyle = polygon.color + '44';
    for (let i = 0; i < intersections.length; i += 2) {
      if (i + 1 < intersections.length) {
        const start = this.to2DScreen(Vec3.create(intersections[i], y, 0));
        const end = this.to2DScreen(Vec3.create(intersections[i + 1], y, 0));
        
        this.ctx.fillRect(start.x, start.y - 8, end.x - start.x, 16);
      }
    }
  }
  
  render3DPoints() {
    this.mode = '3d';
    // TODO: 实现3D点渲染
  }
  
  render2DSkyline() {
    this.mode = '2d';
    // TODO: 实现天际线渲染
  }
  
  switchAlgorithm(algorithm) {
    this.algorithm = algorithm;
    this.stopAnimation();
    this.updateControlsForAlgorithm();
    this.render();
  }
  
  updateControlsForAlgorithm() {
    const title = document.getElementById('current-algorithm-title');
    const controls = document.querySelector('.algorithm-controls .control-buttons');
    
    switch (this.algorithm) {
      case 'rect3d':
        title.textContent = '长方体积并';
        controls.innerHTML = `
          <button id="add-rect" class="control-btn">添加长方体</button>
          <button id="clear-all" class="control-btn">清空</button>
          <button id="calculate-volume" class="control-btn">计算体积</button>
          <button id="animate-scan" class="control-btn primary">扫描线动画</button>
        `;
        break;
      case 'segint':
        title.textContent = '线段相交检测';
        controls.innerHTML = `
          <button id="add-segment" class="control-btn">添加线段</button>
          <button id="clear-all" class="control-btn">清空</button>
          <button id="find-intersections" class="control-btn">查找相交</button>
          <button id="animate-scan" class="control-btn primary">扫描线动画</button>
        `;
        break;
      case 'polyfill':
        title.textContent = '多边形填充';
        controls.innerHTML = `
          <button id="add-polygon" class="control-btn">添加多边形</button>
          <button id="clear-all" class="control-btn">清空</button>
          <button id="fill-polygon" class="control-btn">填充多边形</button>
          <button id="animate-scan" class="control-btn primary">扫描线动画</button>
        `;
        break;
      case 'cp3d':
        title.textContent = '最近点对(3D)';
        controls.innerHTML = `
          <button id="add-points" class="control-btn">添加随机点</button>
          <button id="clear-all" class="control-btn">清空</button>
          <button id="find-closest" class="control-btn">查找最近点对</button>
          <button id="animate-divide" class="control-btn primary">分治动画</button>
        `;
        break;
      case 'skyline':
        title.textContent = '天际线问题';
        controls.innerHTML = `
          <button id="add-building" class="control-btn">添加建筑</button>
          <button id="clear-all" class="control-btn">清空</button>
          <button id="generate-skyline" class="control-btn">生成天际线</button>
          <button id="animate-scan" class="control-btn primary">扫描线动画</button>
        `;
        break;
    }
    
    this.rebindControlEvents();
  }
  
  rebindControlEvents() {
    const clearBtn = document.getElementById('clear-all');
    const animateBtn = document.getElementById('animate-scan') || document.getElementById('animate-divide');
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }
    
    if (animateBtn) {
      animateBtn.addEventListener('click', () => this.startAnimation());
    }
    
    // 算法特定按钮
    switch (this.algorithm) {
      case 'rect3d':
        const addRectBtn = document.getElementById('add-rect');
        const calcVolumeBtn = document.getElementById('calculate-volume');
        
        if (addRectBtn) {
          addRectBtn.addEventListener('click', () => this.addRandomBox());
        }
        if (calcVolumeBtn) {
          calcVolumeBtn.addEventListener('click', () => this.calculateVolume());
        }
        break;
        
      case 'segint':
        const addSegBtn = document.getElementById('add-segment');
        const findIntBtn = document.getElementById('find-intersections');
        
        if (addSegBtn) {
          addSegBtn.addEventListener('click', () => this.addRandomSegment());
        }
        if (findIntBtn) {
          findIntBtn.addEventListener('click', () => this.render());
        }
        break;
        
      case 'polyfill':
        const fillBtn = document.getElementById('fill-polygon');
        if (fillBtn) {
          fillBtn.addEventListener('click', () => {
            this.polygons2d.forEach(polygon => polygon.filled = true);
            this.render();
          });
        }
        break;
    }
  }
  
  startAnimation() {
    if (this.animating) {
      this.stopAnimation();
      return;
    }
    
    this.animating = true;
    this.currentStep = 0;
    this.totalSteps = 100;
    
    if (this.algorithm === 'rect3d') {
      this.scanPlane.visible = true;
    } else if (this.algorithm === 'segint') {
      this.scanLine2D.visible = true;
      this.scanLine2D.direction = 'x';
    } else if (this.algorithm === 'polyfill') {
      this.scanLine2D.visible = true;
      this.scanLine2D.direction = 'y';
      this.polygons2d.forEach(polygon => polygon.filled = true);
    }
    
    this.animate();
    document.getElementById('play-pause').textContent = '⏸';
  }
  
  animate() {
    if (!this.animating) return;
    
    const progress = this.currentStep / this.totalSteps;
    this.setAnimationProgress(progress);
    
    this.currentStep++;
    if (this.currentStep > this.totalSteps) {
      this.stopAnimation();
      return;
    }
    
    const speed = parseInt(document.getElementById('speed-slider').value);
    setTimeout(() => this.animate(), 1100 - speed * 100);
  }
  
  setAnimationProgress(progress) {
    if (this.algorithm === 'rect3d' && this.boxes3d.length > 0) {
      const minX = Math.min(...this.boxes3d.map(box => box.min.x)) - 1;
      const maxX = Math.max(...this.boxes3d.map(box => box.max.x)) + 1;
      this.scanPlane.x = minX + (maxX - minX) * progress;
    } else if (this.algorithm === 'segint') {
      this.scanLine2D.x = -4 + 8 * progress;
    } else if (this.algorithm === 'polyfill') {
      this.scanLine2D.y = -3 + 6 * progress;
    }
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    const timelineSlider = document.getElementById('timeline-slider');
    if (progressBar) progressBar.style.width = (progress * 100) + '%';
    if (timelineSlider) timelineSlider.value = progress * 100;
    
    this.render();
  }
  
  stopAnimation() {
    this.animating = false;
    document.getElementById('play-pause').textContent = '▶';
    
    // 重置填充状态
    this.polygons2d.forEach(polygon => polygon.filled = false);
  }
  
  toggleAnimation() {
    if (this.animating) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }
  
  stepForward() {
    if (this.animating) return;
    
    this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    const progress = this.currentStep / this.totalSteps;
    this.setAnimationProgress(progress);
  }
  
  stepBackward() {
    if (this.animating) return;
    
    this.currentStep = Math.max(this.currentStep - 1, 0);
    const progress = this.currentStep / this.totalSteps;
    this.setAnimationProgress(progress);
  }
  
  resetView() {
    this.camera = {
      position: Vec3.create(8, 6, 10),
      target: Vec3.create(0, 0, 0),
      rotation: { pitch: 0, yaw: 0 }
    };
    
    this.scale2D = 50;
    this.offset2D = { x: 0, y: 0 };
    
    this.render();
  }
  
  toggleScanPlane() {
    if (this.mode === '3d') {
      this.scanPlane.visible = !this.scanPlane.visible;
    } else {
      this.scanLine2D.visible = !this.scanLine2D.visible;
    }
    this.render();
  }
  
  addRandomBox() {
    const x1 = Math.random() * 6 - 3;
    const y1 = Math.random() * 4 - 2;
    const z1 = Math.random() * 4 - 2;
    const x2 = x1 + Math.random() * 3 + 0.5;
    const y2 = y1 + Math.random() * 2 + 0.5;
    const z2 = z1 + Math.random() * 2 + 0.5;
    
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    this.boxes3d.push({
      min: Vec3.create(Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)),
      max: Vec3.create(Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)),
      color: color
    });
    
    this.render();
  }
  
  addRandomSegment() {
    const x1 = Math.random() * 6 - 3;
    const y1 = Math.random() * 4 - 2;
    const x2 = Math.random() * 6 - 3;
    const y2 = Math.random() * 4 - 2;
    
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    this.segments2d.push({
      start: Vec3.create(x1, y1, 0),
      end: Vec3.create(x2, y2, 0),
      color: color
    });
    
    this.render();
  }
  
  clearAll() {
    this.boxes3d = [];
    this.segments2d = [];
    this.polygons2d = [];
    this.points3d = [];
    
    this.scanPlane.visible = false;
    this.scanLine2D.visible = false;
    
    this.render();
  }
  
  calculateVolume() {
    if (this.boxes3d.length === 0) {
      alert('没有盒子可计算体积');
      return;
    }
    
    let totalVolume = 0;
    this.boxes3d.forEach(box => {
      const volume = (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z);
      totalVolume += volume;
    });
    
    // 简化估计（去重）
    const estimatedVolume = totalVolume * 0.7;
    alert(`总体积（近似）: ${estimatedVolume.toFixed(3)}`);
  }
  
  updateInfo() {
    const scanPos = document.getElementById('scan-pos');
    const currentVolume = document.getElementById('current-volume');
    const algoStatus = document.getElementById('algo-status');
    
    if (this.mode === '3d' && this.scanPlane.visible) {
      scanPos.textContent = 'x = ' + this.scanPlane.x.toFixed(2);
      
      // 计算活跃盒子体积
      const activeBoxes = this.boxes3d.filter(box => 
        box.min.x <= this.scanPlane.x && box.max.x >= this.scanPlane.x
      );
      
      let volume = 0;
      activeBoxes.forEach(box => {
        const v = (box.max.y - box.min.y) * (box.max.z - box.min.z);
        volume += v;
      });
      
      currentVolume.textContent = volume.toFixed(3);
    } else if (this.mode === '2d' && this.scanLine2D.visible) {
      if (this.scanLine2D.direction === 'x') {
        scanPos.textContent = 'x = ' + this.scanLine2D.x.toFixed(2);
      } else {
        scanPos.textContent = 'y = ' + this.scanLine2D.y.toFixed(2);
      }
      currentVolume.textContent = '--';
    } else {
      scanPos.textContent = '--';
      currentVolume.textContent = '--';
    }
    
    algoStatus.textContent = this.animating ? '动画中...' : '就绪';
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new AlgorithmVisualizer();
});
