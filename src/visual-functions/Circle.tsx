import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector2, Vector3 } from "three";
import { FrequencyRange } from "../interfaces/shared-interfaces";

export function Circle(props: any) {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const linePoints: Vector2[] = [];
    const lineSegments = 500.0;
    const size = 5.0;
  
  
    useEffect(()=> {
      for (let i = 0; i < lineSegments; i++) {
        linePoints.push(new Vector2(size + (-2*size*i/lineSegments), Math.random()));
      }
      if (!!props.analyzer && bufferLength == 0) {
        bufferLength = props.analyzer.frequencyBinCount;
        amplitudeArray = new Uint8Array(bufferLength);
        props.analyzer.getByteFrequencyData(amplitudeArray);
      }
    });
  
    function average(nums: Uint8Array) {
      return nums.reduce((a, b) => (a + b)) / nums.length;
    }
  
    function graphFrequencyData(points: Vector2[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
      const freqArray = freqData.subarray(freqRange.start, freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      for (let i = 0; i < points.length; i++) {
        points[i].y = (Math.pow(2, freqAvg/255.0) - 1)*Math.exp(-Math.abs(points[i].x)*0.65)*Math.cos(2*Math.PI*points[i].x + Date.now() / 400);
      }
      return points;
    }
  
    function circleFuzz(points: Vector3[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
      const freqArray = freqData.subarray(freqRange.start, freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      const offset = (freqAvg / (255.0))*0.1;
      const stepSize = 2*Math.PI / points.length;
      for (let i = 0; i < points.length; i++) {
        const t = i+1 * stepSize; // i *stepsize
        points[i].x = (props.ringWidth+offset*Math.cos(props.n*t))*Math.cos(t + Date.now() * 0.0001); // Math.random() > 0.5 ? points[i].x + offset : points[i].x - offset;
        points[i].y = (props.ringWidth+offset*Math.cos(props.n*t))*Math.sin(t + Date.now() * 0.0001);// Math.random() > 0.5 ? points[i].y + offset : points[i].y - offset;
      }
      return points;
    }
  
    useFrame(() => {
      if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        if (props.bolt) {
          props.analyzer.getByteFrequencyData(amplitudeArray);
          geoRef.current.setFromPoints(graphFrequencyData(linePoints, amplitudeArray, props.freqRange));
        }
        else {
          lineRef.current.scale.set(lineRef.current.scale.x + props.scaleRate, lineRef.current.scale.y + props.scaleRate, lineRef.current.scale.z);
          props.analyzer.getByteFrequencyData(amplitudeArray);
          geoRef.current.vertices = circleFuzz(geoRef.current.vertices, amplitudeArray, props.freqRange);
          geoRef.current.verticesNeedUpdate = true;
          if (lineRef.current.scale.x > 10) {
            lineRef.current.scale.set(0.01, 0.01, 1);
            lineRef.current.position.set(lineRef.current.position.x, lineRef.current.position.y, lineRef.current.position.z + 0.0001)
          }
        }
      }
    });
    
  
    return (
      <mesh
        ref={lineRef}
        {...props}
        scale={[props.bolt ? 1 : props.radius, props.bolt ? 1 : props.radius, 1]}>
        <circleGeometry ref={geoRef} args={[1, 500]} attach="geometry" />
        <meshBasicMaterial color={props.color} />
      </mesh>
    );
  }
  