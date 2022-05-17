import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector2 } from "three";

export function WaveformLine(props: any) {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const linePoints: Vector2[] = [];
    const lineSegments = 2048;
    const size = 12.0;
  
    for (let i = 0; i < lineSegments; i++) {
      linePoints.push(new Vector2(size/2 + (-2*size*i/lineSegments), 0));
    }
  
    useEffect(()=> {
      if (!!props.analyzer && bufferLength == 0) {
        bufferLength = props.analyzer.frequencyBinCount;
        amplitudeArray = new Uint8Array(bufferLength);
        props.analyzer.getByteTimeDomainData(amplitudeArray);
      }
    });
  
    function graphFrequencyData(points: Vector2[], freqData: Uint8Array) {
      for (let i = 0; i < points.length; i++) {
        points[i].y = (freqData[i]-128.0)* props.height / 128.0;
      }
      return points;
    }
  
  
    useFrame(() => {
      if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        props.analyzer.getByteTimeDomainData(amplitudeArray);
        geoRef.current.setFromPoints(graphFrequencyData(linePoints, amplitudeArray));
      }
    });
    
  
    return (
      <line
        ref={lineRef}
        {...props}
        scale={[1, 1, 1]}>
        <bufferGeometry ref={geoRef} attach="geometry" />
        <lineBasicMaterial color={props.color} />
      </line>
    );
  }