import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector2, Vector3 } from "three";
import { FrequencyRange } from "../interfaces/shared-interfaces";

export function Ring(props: any) {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const linePoints: Vector2[] = [];
    const lineSegments = 500.0;
    const size = 5.0;
  
    for (let i = 0; i < lineSegments; i++) {
      linePoints.push(new Vector2(size + (-2*size*i/lineSegments), Math.random()));
    }
  
    useEffect(()=> {
      if (!!props.analyzer && bufferLength == 0) {
        bufferLength = props.analyzer.frequencyBinCount;
        amplitudeArray = new Uint8Array(bufferLength);
        props.analyzer.getByteFrequencyData(amplitudeArray);
      }
    });
  
    function average(nums: Uint8Array) {
      return nums.reduce((a, b) => (a + b)) / nums.length;
    }
  
    function ringFuzz(points: Vector3[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
      const freqArray = freqData.subarray(freqRange.start, freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      const offset = (freqAvg / (255.0));
      const n = props.n > 2 ? props.n : 2;
      const stepSize = 2*Math.PI / points.length;
      for (let i = 0; i < points.length; i++) {
        const t = !props.indexStart ? i*stepSize : i+1.0*stepSize; // i *stepsize
        points[i].x = (props.ringWidth+offset*Math.cos(n*t))*Math.cos(t + Date.now() * 0.001); // Math.random() > 0.5 ? points[i].x + offset : points[i].x - offset;
        points[i].y = (props.ringWidth+offset*Math.cos(n*t))*Math.sin(t + Date.now() * 0.001);// Math.random() > 0.5 ? points[i].y + offset : points[i].y - offset;
      }
      return points;
    }
  
    useFrame(() => {
       if (lineRef && lineRef.current && geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        lineRef.current.scale.set(lineRef.current.scale.x + props.scaleRate, lineRef.current.scale.y + props.scaleRate, lineRef.current.scale.z);
        props.analyzer.getByteFrequencyData(amplitudeArray);
        geoRef.current.vertices = ringFuzz(geoRef.current.vertices, amplitudeArray, props.freqRange);
        geoRef.current.verticesNeedUpdate = true;
        if (lineRef.current.scale.x > 10) {
          lineRef.current.scale.set(0.01, 0.01, 1);
          lineRef.current.position.set(lineRef.current.position.x, lineRef.current.position.y, lineRef.current.position.z + 0.0001)
        }
      }
    });
    
  
    return (
      <mesh
        ref={lineRef}
        {...props}
        scale={[props.radius, props.radius, 1]}>
        <ringGeometry ref={geoRef} args={[1-(props.ringSize/2.0), 1+(props.ringSize/2.0), 1024]} attach="geometry" />
        <meshBasicMaterial color={props.color} />
      </mesh>
    );
  }
  