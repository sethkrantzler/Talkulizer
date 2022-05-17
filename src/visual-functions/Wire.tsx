import { useRef, useEffect } from "react";
import { useFrame, useUpdate } from "react-three-fiber";
import { QuadraticBezierCurve3, Vector3, BufferGeometry } from "three";
import { FrequencyRange } from "../interfaces/shared-interfaces";

export function Wire(props: any) {
    const lineRef = useRef<any>(null);
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const curve = new QuadraticBezierCurve3(
      new Vector3( 0, 1, 0 ),
      new Vector3( 0, 0.25, 0.2 ),
      new Vector3( 0, 0, 1 )
    );
  
    const points = curve.getPoints(1024);
  
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
  
    function graphFrequencyData(points: Vector3[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
      const freqArray = freqData.subarray(freqRange.start, freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      if (props.flat) {
        for (let i = 0; i < points.length; i++) {
          points[i].y = (freqAvg/(255.0*10))*Math.exp(-Math.abs(points[i].z)*0.65)*Math.cos(2*Math.PI*points[i].z);
        }
      }
      else if (props.fuzz){
        for (let i = 0; i < points.length; i++) {
          points[i].x = Math.random()*(freqAvg/(255.0));
        }
      } else {
        for (let i = 0; i < points.length; i++) {
          points[i].x = (freqAvg/(255.0*10))*Math.exp(-Math.abs(points[i].z)*0.65)*Math.cos(2*Math.PI*points[i].z); 
        }
      }
      return points;
    }
  
    useFrame(() => {
      if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        props.analyzer.getByteFrequencyData(amplitudeArray);
        geoRef.current.setFromPoints(graphFrequencyData(points, amplitudeArray, props.freqRange));
      }
    });
  
    const geoRef = useUpdate((geometry: BufferGeometry) => {
      geometry.setFromPoints(points)
    }, [])
  
  
    return (
      <line
        ref={lineRef}
        {...props}
        scale={[1, 1, 1]}
        rotation={[0, 30*Math.PI/180, 0]}>
        <bufferGeometry ref={geoRef} attach="geometry" />
        <meshBasicMaterial color={props.color} />
      </line>
    );
  }