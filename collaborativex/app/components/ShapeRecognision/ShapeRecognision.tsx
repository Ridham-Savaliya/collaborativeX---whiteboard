/**
 * Enhanced Shape Recognition System
 * Improved accuracy, better edge detection, and proper shape fitting
 */

export interface RecognizedShape {
  type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'ellipse' | 'diamond' | 'arrow' | 'star';
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  properties?: {
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    points?: { x: number; y: number }[];
    angle?: number;
  };
  originalPoints: { x: number; y: number }[];
  smoothedPoints: { x: number; y: number }[];
}

export interface AnimationFrame {
  progress: number;
  originalPoints: { x: number; y: number }[];
  targetPoints: { x: number; y: number }[];
  interpolatedPoints: { x: number; y: number }[];
}

export class EnhancedShapeRecognizer {
  // Improved thresholds for better accuracy
  private static readonly MIN_POINTS = 4;
  private static readonly SHAPE_CONFIDENCE_THRESHOLD = 0.55; // Slightly lower to catch more shapes
  private static readonly TOLERANCE = 0.2; // Reduced tolerance for better precision
  private static readonly SMOOTHING_RADIUS = 4; // Increased for better smoothing
  private static readonly CORNER_ANGLE_THRESHOLD = Math.PI / 5; // 36 degrees - better for detecting corners
  

    /**
   * Generate Gaussian weights for smoothing
   */
  private static generateGaussianWeights(radius: number, sigma: number): number[] {
    const weights: number[] = [];
    let sum = 0;

    for (let i = -radius; i <= radius; i++) {
      const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
      weights.push(weight);
      sum += weight;
    }

    // Normalize so total weight = 1
    return weights.map(w => w / sum);
  }

  /**
   * Main shape recognition function with improved accuracy
   */
  static recognizeShape(points: { x: number; y: number }[]): RecognizedShape | null {
    if (points.length < this.MIN_POINTS) return null;

    // Pre-process points with advanced filtering
    const processedPoints = this.preprocessPoints(points);
    if (processedPoints.length < this.MIN_POINTS) return null;

    const bounds = this.getBoundingBox(processedPoints);
    const center = this.getCenter(bounds);
    const normalizedPoints = this.normalizePoints(processedPoints, bounds);

    // Enhanced shape recognition with better algorithms
    const recognitionResults = [
      this.recognizeCircle(normalizedPoints, bounds, processedPoints),
      this.recognizeRectangle(normalizedPoints, bounds, processedPoints),
      this.recognizeTriangle(normalizedPoints, bounds, processedPoints),
      this.recognizeLine(normalizedPoints, bounds, processedPoints),
      this.recognizeEllipse(normalizedPoints, bounds, processedPoints),
      this.recognizeDiamond(normalizedPoints, bounds, processedPoints),
      this.recognizeArrow(normalizedPoints, bounds, processedPoints),
      this.recognizeStar(normalizedPoints, bounds, processedPoints),
    ].filter(result => result !== null) as RecognizedShape[];

    // Return the result with highest confidence
    const bestMatch = recognitionResults
      .filter(result => result.confidence >= this.SHAPE_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (bestMatch) {
      return {
        ...bestMatch,
        bounds,
        center,
        originalPoints: points,
        smoothedPoints: processedPoints,
      };
    }

    return null;
  }

  /**
   * Advanced point preprocessing with improved algorithms
   */

/**
 * Ramer-Douglas-Peucker algorithm for polyline simplification
 */
private static douglasPeucker(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length < 3) return points;

  // Find the point with the maximum distance from the line between start and end
  let maxDistance = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = this.pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    // Recursive call on the first segment
    const leftSegment = points.slice(0, maxIndex + 1);
    const rightSegment = points.slice(maxIndex);

    // Simplify both segments and combine results, excluding duplicate point
    const leftResult = this.douglasPeucker(leftSegment, epsilon);
    const rightResult = this.douglasPeucker(rightSegment, epsilon);

    return [...leftResult.slice(0, -1), ...rightResult];
  } else {
    // If no point is far enough, return just the start and end points
    return [start, end];
  }
}

  private static preprocessPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
    // Remove duplicate points with adaptive threshold
    let cleaned = this.removeDuplicates(points);
    
    // Apply enhanced Gaussian smoothing
    cleaned = this.applyGaussianSmoothing(cleaned);
    
    // Apply Ramer-Douglas-Peucker algorithm with adaptive epsilon
    const epsilon = this.calculateAdaptiveEpsilon(cleaned);
    cleaned = this.douglasPeucker(cleaned, epsilon);
    
    // Final smoothing pass with improved algorithm
    cleaned = this.applyAdvancedSmoothing(cleaned);
    
    return cleaned;
  }

  /**
   * Calculate adaptive epsilon based on the shape's size and complexity
   */
  private static calculateAdaptiveEpsilon(points: { x: number; y: number }[]): number {
    const bounds = this.getBoundingBox(points);
    const diagonalLength = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height);
    
    // Scale epsilon based on the shape size
    const baseEpsilon = 2.0;
    const sizeScale = Math.min(1.5, Math.max(0.5, diagonalLength / 300));
    
    // Adjust based on point density
    const density = points.length / diagonalLength;
    const densityScale = Math.min(1.5, Math.max(0.5, density * 50));
    
    return baseEpsilon * sizeScale / densityScale;
  }

  private static removeDuplicates(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 2) return points;
    
    const result = [points[0]];
    let prevPoint = points[0];
    
    for (let i = 1; i < points.length; i++) {
      const distance = this.euclideanDistance(points[i], prevPoint);
      // Adaptive threshold based on the total path length
      const threshold = 1.0;
      if (distance > threshold) {
        result.push(points[i]);
        prevPoint = points[i];
      }
    }
    return result;
  }

  private static applyGaussianSmoothing(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 5) return points;
    
    const sigma = 1.2; // Increased sigma for better smoothing
    const radius = this.SMOOTHING_RADIUS;
    const weights = this.generateGaussianWeights(radius, sigma);
    
    const smoothed = [];
    for (let i = 0; i < points.length; i++) {
      let weightedX = 0, weightedY = 0, totalWeight = 0;
      
      for (let j = -radius; j <= radius; j++) {
        const index = Math.max(0, Math.min(points.length - 1, i + j));
        const weight = weights[j + radius];
        weightedX += points[index].x * weight;
        weightedY += points[index].y * weight;
        totalWeight += weight;
      }
      
      smoothed.push({
        x: weightedX / totalWeight,
        y: weightedY / totalWeight
      });
    }
    
    return smoothed;
  }

  /**
   * Advanced smoothing algorithm that preserves corners better
   */
  private static applyAdvancedSmoothing(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 5) return points;
    
    const result = [points[0]];
    
    // Detect potential corners first
    const isCorner = new Array(points.length).fill(false);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      isCorner[i] = angleDiff > this.CORNER_ANGLE_THRESHOLD;
    }
    
    // Apply adaptive smoothing that preserves corners
    for (let i = 1; i < points.length - 1; i++) {
      if (isCorner[i]) {
        // Preserve corners
        result.push(points[i]);
      } else {
        // Apply stronger smoothing for non-corners
        const windowSize = 3;
        let sumX = 0, sumY = 0;
        let count = 0;
        
        for (let j = -windowSize; j <= windowSize; j++) {
          const index = i + j;
          if (index >= 0 && index < points.length && !isCorner[index]) {
            sumX += points[index].x;
            sumY += points[index].y;
            count++;
          }
        }
        
        if (count > 0) {
          result.push({
            x: sumX / count,
            y: sumY / count
          });
        } else {
          result.push(points[i]);
        }
      }
    }
    
    result.push(points[points.length - 1]);
    return result;
  }

  /**
   * Enhanced circle recognition with improved fitting algorithm
   */
  private static recognizeCircle(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const aspectRatio = bounds.width / bounds.height;
    // More permissive aspect ratio check
    if (Math.abs(aspectRatio - 1) > 0.35) return null;
    
    // Improved circle fitting using least squares method
    // Find optimal center instead of assuming center is at (0.5, 0.5)
    let centerX = 0, centerY = 0;
    for (const p of normalizedPoints) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= normalizedPoints.length;
    centerY /= normalizedPoints.length;
    
    const center = { x: centerX, y: centerY };
    const distances = normalizedPoints.map(p => 
      Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2)
    );
    
    const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + (d - avgRadius) ** 2, 0) / distances.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Improved inlier detection with adaptive threshold
    const inlierThreshold = Math.min(0.2, Math.max(0.1, standardDeviation * 2));
    const inliers = distances.filter(d => Math.abs(d - avgRadius) < inlierThreshold).length;
    const inlierRatio = inliers / normalizedPoints.length;
    
    // More permissive inlier ratio for better circle detection
    if (inlierRatio < 0.65) return null;
    
    // Improved confidence calculation
    const confidence = Math.min(0.98, inlierRatio * (1 - standardDeviation / avgRadius) * (1 - Math.abs(aspectRatio - 1)));
    
    return {
      type: 'circle',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      properties: { radius: avgRadius },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Enhanced rectangle recognition with improved corner detection
   */
  private static recognizeRectangle(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    // Find corners using enhanced angle detection
    const corners = this.detectCorners(normalizedPoints);
    
    // More permissive corner count for rectangles
    if (corners.length < 3 || corners.length > 8) return null;
    
    // Check if points tend to stay near rectangle edges with improved algorithm
    let edgeScore = 0;
    const margin = 0.15; // Increased margin for better edge detection
    
    for (const point of normalizedPoints) {
      const nearLeft = point.x < margin;
      const nearRight = point.x > 1 - margin;
      const nearTop = point.y < margin;
      const nearBottom = point.y > 1 - margin;
      
      // Check if point is near any edge
      const nearHorizontalEdge = (nearTop || nearBottom) && point.x >= margin && point.x <= 1 - margin;
      const nearVerticalEdge = (nearLeft || nearRight) && point.y >= margin && point.y <= 1 - margin;
      
      if (nearHorizontalEdge || nearVerticalEdge) {
        // Weight points that are very close to edges higher
        const distToEdge = Math.min(
          point.x, 
          point.y, 
          Math.abs(1 - point.x), 
          Math.abs(1 - point.y)
        );
        const weight = 1 + (margin - distToEdge) / margin;
        edgeScore += weight;
      }
    }
    
    const edgeRatio = edgeScore / normalizedPoints.length;
    // More permissive edge ratio
    if (edgeRatio < 0.55) return null;
    
    // Analyze corner angles with improved algorithm
    const cornerAngles = this.analyzeCornerAngles(corners);
    const rightAngles = cornerAngles.filter(angle => 
      Math.abs(angle - Math.PI / 2) < Math.PI / 6 // More permissive right angle detection
    ).length;
    
    // Improved confidence calculation
    const cornerConfidence = rightAngles / Math.min(corners.length, 4);
    const confidence = Math.min(0.98, (edgeRatio * 0.6 + cornerConfidence * 0.4) * (1 + Math.min(corners.length, 4) / 8));
    
    return {
      type: 'rectangle',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Enhanced triangle recognition
   */
  private static recognizeTriangle(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const corners = this.detectCorners(normalizedPoints);
    if (corners.length < 2 || corners.length > 5) return null;
    
    // Find the three most prominent corners
    const sortedCorners = corners
      .map(corner => ({
        ...corner,
        prominence: this.calculateCornerProminence(corner, normalizedPoints)
      }))
      .sort((a, b) => b.prominence - a.prominence)
      .slice(0, 3);
    
    if (sortedCorners.length < 3) return null;
    
    // Check if points roughly follow triangle edges
    const triangleEdges = [
      [sortedCorners[0], sortedCorners[1]],
      [sortedCorners[1], sortedCorners[2]],
      [sortedCorners[2], sortedCorners[0]]
    ];
    
    let edgeScore = 0;
    for (const point of normalizedPoints) {
      const minDistanceToEdges = Math.min(
        ...triangleEdges.map(edge => 
          this.pointToLineDistance(point, edge[0], edge[1])
        )
      );
      if (minDistanceToEdges < 0.08) edgeScore++;
    }
    
    const edgeRatio = edgeScore / normalizedPoints.length;
    if (edgeRatio < 0.5) return null;
    
    const confidence = Math.min(0.9, edgeRatio + sortedCorners[0].prominence * 0.2);
    
    return {
      type: 'triangle',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      properties: {
        points: sortedCorners
      },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Enhanced line recognition with straightness analysis
   */
  private static recognizeLine(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const aspectRatio = bounds.width / bounds.height;
    if (aspectRatio < 2.5 && aspectRatio > 0.4) return null;
    
    // Fit line using least squares
    const lineParams = this.fitLine(normalizedPoints);
    if (!lineParams) return null;
    
    // Calculate R-squared for goodness of fit
    const rSquared = this.calculateLineRSquared(normalizedPoints, lineParams);
    if (rSquared < 0.8) return null;
    
    // Additional straightness check
    const straightness = this.calculateStraightness(originalPoints);
    const confidence = Math.min(0.95, (rSquared + straightness) / 2);
    
    return {
      type: 'line',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      properties: {
        points: [originalPoints[0], originalPoints[originalPoints.length - 1]],
        angle: lineParams.angle
      },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Enhanced ellipse recognition
   */
  private static recognizeEllipse(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const aspectRatio = bounds.width / bounds.height;
    
    // Skip if too close to circle or line
    if (Math.abs(aspectRatio - 1) < 0.4) return null;
    if (aspectRatio > 4 || aspectRatio < 0.25) return null;
    
    const center = { x: 0.5, y: 0.5 };
    const radiusX = 0.45;
    const radiusY = 0.45 / Math.max(aspectRatio, 1/aspectRatio);
    
    // Calculate ellipse fit score
    let fitScore = 0;
    for (const point of normalizedPoints) {
      const ellipseValue = ((point.x - center.x) / radiusX) ** 2 + ((point.y - center.y) / radiusY) ** 2;
      const deviation = Math.abs(ellipseValue - 1);
      if (deviation < 0.3) fitScore++;
    }
    
    const fitRatio = fitScore / normalizedPoints.length;
    if (fitRatio < 0.6) return null;
    
    const confidence = Math.min(0.9, fitRatio * 0.9 + 0.1);
    
    return {
      type: 'ellipse',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      properties: { radiusX, radiusY },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Enhanced diamond recognition
   */
  private static recognizeDiamond(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const aspectRatio = bounds.width / bounds.height;
    if (Math.abs(aspectRatio - 1) > 0.3) return null;
    
    const corners = this.detectCorners(normalizedPoints);
    if (corners.length < 3 || corners.length > 6) return null;
    
    // Look for diamond pattern - 4 corners roughly forming a diamond
    const center = { x: 0.5, y: 0.5 };
    const expectedCorners = [
      { x: 0.5, y: 0 },    // top
      { x: 1, y: 0.5 },    // right
      { x: 0.5, y: 1 },    // bottom
      { x: 0, y: 0.5 }     // left
    ];
    
    let diamondScore = 0;
    for (const corner of corners) {
      const minDistance = Math.min(
        ...expectedCorners.map(expected => 
          this.euclideanDistance(corner, expected)
        )
      );
      if (minDistance < 0.15) diamondScore++;
    }
    
    if (diamondScore < 3) return null;
    
    // Check Manhattan distance pattern
    let manhattanScore = 0;
    for (const point of normalizedPoints) {
      const manhattanDistance = Math.abs(point.x - center.x) + Math.abs(point.y - center.y);
      if (Math.abs(manhattanDistance - 0.4) < 0.15) manhattanScore++;
    }
    
    const manhattanRatio = manhattanScore / normalizedPoints.length;
    if (manhattanRatio < 0.4) return null;
    
    const confidence = Math.min(0.9, (diamondScore / 4 + manhattanRatio) / 2);
    
    return {
      type: 'diamond',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Arrow recognition
   */
  private static recognizeArrow(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const aspectRatio = bounds.width / bounds.height;
    if (aspectRatio < 1.5) return null;
    
    // Look for arrow head pattern at one end
    const startPoints = normalizedPoints.slice(0, Math.min(5, normalizedPoints.length));
    const endPoints = normalizedPoints.slice(-Math.min(5, normalizedPoints.length));
    
    const startSpread = this.calculatePointSpread(startPoints);
    const endSpread = this.calculatePointSpread(endPoints);
    
    // Arrow should have one end more spread out (the head)
    const spreadRatio = Math.max(startSpread, endSpread) / Math.min(startSpread, endSpread);
    
    if (spreadRatio < 1.5) return null;
    
    const confidence = Math.min(0.8, spreadRatio / 3);
    
    return {
      type: 'arrow',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  /**
   * Star recognition (basic implementation)
   */
  private static recognizeStar(normalizedPoints: { x: number; y: number }[], bounds: any, originalPoints: { x: number; y: number }[]): RecognizedShape | null {
    const corners = this.detectCorners(normalizedPoints);
    if (corners.length < 8 || corners.length > 12) return null;
    
    const center = { x: 0.5, y: 0.5 };
    
    // Check for alternating distances from center (star pattern)
    const distances = corners.map(corner => 
      this.euclideanDistance(corner, center)
    );
    
    // Look for bimodal distribution of distances
    distances.sort((a, b) => a - b);
    const median = distances[Math.floor(distances.length / 2)];
    
    const innerPoints = distances.filter(d => d < median * 1.2).length;
    const outerPoints = distances.filter(d => d > median * 0.8).length;
    
    if (innerPoints < 2 || outerPoints < 2) return null;
    
    const confidence = Math.min(0.7, (innerPoints + outerPoints) / distances.length);
    
    return {
      type: 'star',
      confidence,
      bounds,
      center: { x: 0, y: 0 },
      originalPoints,
      smoothedPoints: originalPoints,
    };
  }

  // Helper methods (keeping existing ones and adding new ones)
  private static detectCorners(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 3) return [];
    
    const corners: { x: number; y: number }[] = [];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Calculate angle at current point
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff > this.CORNER_ANGLE_THRESHOLD) {
        corners.push(curr);
      }
    }
    
    return corners;
  }

  private static calculateCornerProminence(corner: { x: number; y: number }, points: { x: number; y: number }[]): number {
    // Calculate how prominent this corner is based on local curvature
    let maxCurvature = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      if (this.euclideanDistance(points[i], corner) < 0.05) {
        const curvature = this.calculateCurvature(points[i - 1], points[i], points[i + 1]);
        maxCurvature = Math.max(maxCurvature, curvature);
      }
    }
    
    return maxCurvature;
  }

  private static calculateCurvature(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
    const a = this.euclideanDistance(p1, p2);
    const b = this.euclideanDistance(p2, p3);
    const c = this.euclideanDistance(p1, p3);
    
    if (a === 0 || b === 0) return 0;
    
    const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / 2;
    return (4 * area) / (a * b * c);
  }

  private static fitLine(points: { x: number; y: number }[]): { slope: number; intercept: number; angle: number } | null {
    if (points.length < 2) return null;
    
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const angle = Math.atan(slope);
    
    return { slope, intercept, angle };
  }

  private static calculateLineRSquared(points: { x: number; y: number }[], lineParams: { slope: number; intercept: number }): number {
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    let ssRes = 0; // Sum of squares of residuals
    let ssTot = 0; // Total sum of squares
    
    for (const point of points) {
      const predictedY = lineParams.slope * point.x + lineParams.intercept;
      ssRes += (point.y - predictedY) ** 2;
      ssTot += (point.y - meanY) ** 2;
    }
    
    return 1 - (ssRes / ssTot);
  }

  private static calculatePointSpread(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;
    
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    const distances = points.map(p => 
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    );
    
    return Math.max(...distances);
  }

  private static analyzeCornerAngles(corners: { x: number; y: number }[]): number[] {
    const angles = [];
    
    for (let i = 0; i < corners.length; i++) {
      const prev = corners[(i - 1 + corners.length) % corners.length];
      const curr = corners[i];
      const next = corners[(i + 1) % corners.length];
      
      const angle1 = Math.atan2(prev.y - curr.y, prev.x - curr.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let angleDiff = Math.abs(angle2 - angle1);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      angles.push(angleDiff);
    }
    
    return angles;
  }

  // Keep existing helper methods
  private static euclideanDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  private static getBoundingBox(points: { x: number; y: number }[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private static getCenter(bounds: any) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  }

  private static normalizePoints(points: { x: number; y: number }[], bounds: any) {
    if (bounds.width === 0 || bounds.height === 0) return points;
    return points.map(point => ({
      x: (point.x - bounds.x) / bounds.width,
      y: (point.y - bounds.y) / bounds.height
    }));
  }

  private static calculateStraightness(points: { x: number; y: number }[]): number {
    if (points.length < 3) return 1;

    const first = points[0];
    const last = points[points.length - 1];
    const expectedLength = this.euclideanDistance(first, last);
    
    if (expectedLength === 0) return 0;

    let totalDeviation = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const deviation = this.pointToLineDistance(points[i], first, last);
      totalDeviation += deviation;
    }

    const avgDeviation = totalDeviation / (points.length - 2);
    return Math.max(0, 1 - (avgDeviation / (expectedLength * 0.1)));
  }

  private static pointToLineDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate smooth shape points for animation
   */
  static generateShapePoints(shape: RecognizedShape): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const { bounds, type } = shape;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    switch (type) {
      case 'circle':
        const radius = Math.min(bounds.width, bounds.height) / 2 * 0.95;
        for (let i = 0; i < 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        break;

      case 'rectangle':
        const margin = 2;
        const rectPoints = [
          { x: bounds.x + margin, y: bounds.y + margin },
          { x: bounds.x + bounds.width - margin, y: bounds.y + margin },
          { x: bounds.x + bounds.width - margin, y: bounds.y + bounds.height - margin },
          { x: bounds.x + margin, y: bounds.y + bounds.height - margin },
          { x: bounds.x + margin, y: bounds.y + margin }
        ];
        
        // Interpolate between corners for smooth animation
        rectPoints.forEach((point, i) => {
          const nextPoint = rectPoints[(i + 1) % rectPoints.length];
          const steps = 16;
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            points.push({
              x: point.x + (nextPoint.x - point.x) * t,
              y: point.y + (nextPoint.y - point.y) * t
            });
          }
        });
        break;

      case 'triangle':
        points.push(
          { x: centerX, y: bounds.y + 2 },
          { x: bounds.x + 2, y: bounds.y + bounds.height - 2 },
          { x: bounds.x + bounds.width - 2, y: bounds.y + bounds.height - 2 },
          { x: centerX, y: bounds.y + 2 }
        );
        break;

      case 'ellipse':
        const radiusX = bounds.width / 2 * 0.95;
        const radiusY = bounds.height / 2 * 0.95;
        for (let i = 0; i < 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          points.push({
            x: centerX + Math.cos(angle) * radiusX,
            y: centerY + Math.sin(angle) * radiusY
          });
        }
        break;

      case 'diamond':
        points.push(
          { x: centerX, y: bounds.y + 2 },
          { x: bounds.x + bounds.width - 2, y: centerY },
          { x: centerX, y: bounds.y + bounds.height - 2 },
          { x: bounds.x + 2, y: centerY },
          { x: centerX, y: bounds.y + 2 }
        );
        break;

      case 'line':
        if (shape.properties?.points) {
          points.push(...shape.properties.points);
        }
        break;

      case 'arrow':
        const arrowLength = bounds.width * 0.9;
        const arrowHeight = bounds.height * 0.3;
        points.push(
          { x: bounds.x + 5, y: centerY },
          { x: bounds.x + arrowLength * 0.7, y: centerY },
          { x: bounds.x + arrowLength * 0.7, y: centerY - arrowHeight },
          { x: bounds.x + arrowLength, y: centerY },
          { x: bounds.x + arrowLength * 0.7, y: centerY + arrowHeight },
          { x: bounds.x + arrowLength * 0.7, y: centerY },
          { x: bounds.x + 5, y: centerY }
        );
        break;

      case 'star':
        const starRadius = Math.min(bounds.width, bounds.height) / 2 * 0.9;
        const innerRadius = starRadius * 0.4;
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const radius = i % 2 === 0 ? starRadius : innerRadius;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        points.push(points[0]); // Close the shape
        break;
    }

    return points;
  }

  /**
   * Generate smooth animation frames
   */
  static generateAnimationFrames(
    originalPoints: { x: number; y: number }[],
    recognizedShape: RecognizedShape
  ): AnimationFrame[] {
    const targetPoints = this.generateShapePoints(recognizedShape);
    const frameCount = 30; // Smoother animation
    const frames: AnimationFrame[] = [];

    for (let i = 0; i <= frameCount; i++) {
      const progress = this.easeInOutQuart(i / frameCount);
      const interpolatedPoints = this.interpolatePoints(originalPoints, targetPoints, progress);
      
      frames.push({
        progress,
        originalPoints: [...originalPoints],
        targetPoints: [...targetPoints],
        interpolatedPoints
      });
    }

    return frames;
  }

  private static interpolatePoints(
    from: { x: number; y: number }[],
    to: { x: number; y: number }[],
    progress: number
  ): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    const maxLength = Math.max(from.length, to.length);
    
    for (let i = 0; i < maxLength; i++) {
      const fromIndex = Math.min(i, from.length - 1);
      const toIndex = Math.min(i, to.length - 1);
      
      const fromPoint = from[fromIndex];
      const toPoint = to[toIndex];

      result.push({
        x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
        y: fromPoint.y + (toPoint.y - fromPoint.y) * progress
      });
    }

    return result;
  }

  private static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }
}