import { useRef, useState, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Vector3 } from "three";
import { calculateVectorBetweenVectors, vectorToAngle } from "../utils/MathUtils";

export function Racecar(props: any) {
    const geoRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
  
    let bufferLength = 0;
    let amplitudeArray = new Uint8Array(0);
  
    // Initialize vertices
    const totalPoints = 500;
    let hasSetMesh = false;
  
    const [pos, setPos] = useState(0);
  
  
    useEffect(()=> {
      hasSetMesh = false;
      if (!!props.analyzer && bufferLength == 0) {
        bufferLength = props.analyzer.frequencyBinCount;
        amplitudeArray = new Uint8Array(bufferLength);
        props.analyzer.getByteFrequencyData(amplitudeArray);
      }
    });
  
    function setShape(vertices: Vector3[]){
      const stepSize = 2*Math.PI / vertices.length;
      for (let i = 0; i < vertices.length; i++) {
        const t = i+1 * stepSize;
        vertices[i].x = (props.size*Math.cos(props.n*t))*Math.cos(t);
        vertices[i].y = (props.size*Math.cos(props.n*t))*Math.sin(t);
      }
    }
  
    function average(nums: Uint8Array) {
      return nums.reduce((a, b) => (a + b)) / nums.length;
    }
  
  
    function calculatePosition(freqData: Uint8Array){
      const freqArray = freqData.subarray(props.freqRange.start, props.freqRange.end);
      const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
      if (props.loop){
        let t: number;
        if (props.seperate){
          const newT = pos+((freqAvg/255.0)+0.15)*(props.speed/1000.0);
          t = newT > (Math.PI) ? (Math.PI*-1) : newT;
          setPos(t);
        }
        else {
          t = (Math.PI/(2.0*props.speed*2.5))*(Date.now()%(props.speed*10))-(Math.PI/4.0)+(freqAvg/255.0)*0.5;
        }
        let x = (props.lineWidth*Math.cos(t))/(1+Math.pow(Math.sin(t), 2));
        let y = (props.lineWidth*Math.sin(t)*Math.cos(t))/(1+Math.pow(Math.sin(t), 2));;
        return new Vector3(x, y, 0);
      }
      else {
        return lineRef.current.position.x > 8 ? new Vector3(-8,0,0): new Vector3(lineRef.current.position.x + ((freqAvg/255.0)+0.4)*(props.speed/1000.0),0,0);
      }
    }
  
    useFrame(() => {
      if (lineRef && lineRef.current && !hasSetMesh) {
        setShape(lineRef.current.geometry.vertices);
        lineRef.current.geometry.verticesNeedUpdate = true;
        lineRef.current.rotation.x = 0;
        lineRef.current.rotation.y = 0;
        lineRef.current.rotation.z = 0;
        hasSetMesh = true;
      }
      if (lineRef && lineRef.current && geoRef && !!props.analyzer && amplitudeArray) {
        let newRotation: Vector3;
        props.analyzer.getByteFrequencyData(amplitudeArray);
        const newPosition = calculatePosition(amplitudeArray);
        if (props.offaxis && props.loop){
          newRotation=new Vector3(newPosition.x - lineRef.current.position.x, newPosition.y - lineRef.current.position.y, 0);
          lineRef.current.lookAt(newRotation)
        }
        else if (props.offaxis && !props.loop) {
          lineRef.current.lookAt(new Vector3(0,1,0));
        }
        else{
          const movementVector = calculateVectorBetweenVectors(lineRef.current.position.x, newPosition.x, newPosition.y, lineRef.current.position.y);
          const angle = vectorToAngle(movementVector[0], movementVector[1]);
          lineRef.current.rotation.z = angle+(Math.PI/2);
        }
        lineRef.current.position.x = newPosition.x;
        lineRef.current.position.y = newPosition.y;
        lineRef.current.position.z = newPosition.z;
      }
    });
    
  
    return (
      <mesh
        ref={lineRef}
        {...props}
        scale={[10, 10, 10]}>
        <circleGeometry ref={geoRef} args={[1, 500]} attach="geometry" />
        <meshBasicMaterial color={props.color} />
      </mesh>
    );
  }