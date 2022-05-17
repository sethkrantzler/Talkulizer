import { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector3 } from "three";

export function StandardBox(props: any)  {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
    const topVertices = [true,true,false,false, true, true, false, false];
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
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
  
    function updateHeight(vertices: Vector3[], freqData: Uint8Array){
      const freqArray = freqData.subarray(props.freqRange.start, props.freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      for (let i=0; i < vertices.length; i++){
        vertices[i].y = !topVertices[i] ? 0 : props.height*freqAvg/(255.0);
      }
      return;
    }
  
  
    useFrame(() => {
      if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray) {
        props.analyzer.getByteFrequencyData(amplitudeArray);
        updateHeight(geoRef.current.vertices, amplitudeArray);
        geoRef.current.verticesNeedUpdate = true;
      }
    });
    
  
    return (
      <>
        <mesh
          ref={lineRef}
          {...props}
          scale={[1.0*props.width, 1, 0]}
          rotation={[0,0, !!props.rot ? props.rot : 0]}
        >
          <boxGeometry ref={geoRef} attach="geometry" />
          <meshBasicMaterial color={props.color} />
        </mesh>
      </>
    );
  }