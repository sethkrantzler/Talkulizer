import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector2, DoubleSide } from "three";
import { FrequencyRange } from "../interfaces/shared-interfaces";

export function Cube(props: any) {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
    const freqRanges: FrequencyRange[] = [
      {start: 0, end: 2, color: '#CFFFB3'},
      {start: 4, end:  10, color: '#337CA0'},
      {start: 13, end:  22, color: '#46237A'},
      {start: 40, end:  88, color: '#FFB400'},
      {start: 100, end:  256, color: '#EE5622'},
      {start: 500, end:  852, color: '#3A5311'}
    ];
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const linePoints: Vector2[] = [];
    const lineSegments = 500.0;
    const size = 3.0;
  
    for (let i = 0; i < lineSegments; i++) {
      linePoints.push(new Vector2(0, size + (-2*size*i/lineSegments)));
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
  
    function getColor(){
      let loudestAmp = 0;
      let loudestBand = 0;
      freqRanges.map((range, index) => {
        const averageAmp = average(amplitudeArray.subarray(range.start, range.end));
        if (averageAmp > loudestAmp) {
          loudestBand = index;
          loudestAmp = averageAmp;
        }
      });
      return freqRanges[loudestBand].color;
    }
  
  
    useFrame(() => {
      if (lineRef && lineRef.current && !!props.analyzer && amplitudeArray) {
        props.analyzer.getByteFrequencyData(amplitudeArray);
        lineRef.current.material.color.set(getColor());
        lineRef.current.rotation.set(lineRef.current.rotation.x + 0.005, lineRef.current.rotation.y + 0.005, lineRef.current.rotation.z)
      }
    });
    
  
    return (
      <mesh
        ref={lineRef}
        {...props}
        scale={[1, 1, 1]}>
        <boxBufferGeometry ref={geoRef} args={[3,3, 3]} attach="geometry" />
        <meshBasicMaterial color={'purple'} side={DoubleSide} attach="material"/>
      </mesh>
    );
  }
  