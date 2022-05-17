import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector2 } from "three";
import { FrequencyRange } from "../interfaces/shared-interfaces";

export function Bolt(props: any) {
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
  
    function graphFrequencyData(points: Vector2[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
      const freqArray = freqData.subarray(freqRange.start, freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      for (let i = 0; i < points.length; i++) {
        points[i].y = (Math.pow(2, freqAvg/255.0) - 1)*Math.exp(-Math.abs(points[i].x)*0.65)*Math.cos(2*Math.PI*points[i].x + Date.now() / 400);
      }
      return points;
    }
  
    useFrame(() => {
      if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        props.analyzer.getByteFrequencyData(amplitudeArray);
        geoRef.current.setFromPoints(graphFrequencyData(linePoints, amplitudeArray, props.freqRange));
      }
    });
    
  
    return (
      <mesh
        ref={lineRef}
        {...props}
        scale={[ 1, 1, 1]}>
        <circleBufferGeometry ref={geoRef} args={[1, 1024]} attach="geometry" />
        <meshBasicMaterial color={props.color} />
      </mesh>
    );
  }
  