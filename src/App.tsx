import ReactDOM from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useResource, useThree, useUpdate } from 'react-three-fiber';
import { BufferGeometry, CircleBufferGeometry, CircleGeometry, Color, EdgesGeometry, Geometry, LineBasicMaterial, Mesh, Points, Scene, Vector2, DoubleSide, CubicBezierCurve3, Vector3, QuadraticBezierCurve3} from 'three';
import './App.css';
import { Input, MenuItem, Select, TextField, Slider, Button, InputLabel, FormControl } from '@material-ui/core';
import { ColorPalettes } from './ColorPalette';
import axios from 'axios';
import { calculateVectorBetweenVectors, vectorToAngle } from './MathUtils';
import { Dictionary } from 'ts-json-db/dist/src';

interface FrequencyRange {
  start: number;
  end: number;
  color?: string;
}

interface SliderOptions{
  param1: string;
  param2: string;
  offset: string;
  spread: string;
}

interface Preset {
  presetName: string;
  visualizerType: string,
  colorIndex: number,
  spread: number,
  offset: number,
  param1: number,
  param2: number
}

function StandardBox(props: any) {
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

function HorizontalLine(props: any) {
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
    <line
      ref={lineRef}
      {...props}
      scale={[1, 1, 1]}>
      <bufferGeometry ref={geoRef} attach="geometry" />
      <lineBasicMaterial color={props.color} />
    </line>
  );
}

function VerticalLine(props: any) {
  const geoRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

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

  function graphFrequencyData(points: Vector2[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
    const freqArray = freqData.subarray(freqRange.start, freqRange.end);
    const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
    for (let i = 0; i < points.length; i++) {
      points[i].x = (Math.pow(2, freqAvg/255.0) - 1)*Math.exp(-Math.abs(points[i].y)*0.65)*Math.cos(2*Math.PI*points[i].y + Date.now() / 400);
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
    <line
      ref={lineRef}
      {...props}
      scale={[1, 1, 1]}>
      <bufferGeometry ref={geoRef} attach="geometry" />
      <lineBasicMaterial color={props.color} />
    </line>
  );
}

function Plane(props: any) {
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
      <planeBufferGeometry ref={geoRef} args={[3,3]} attach="geometry" />
      <meshBasicMaterial color={'purple'} side={DoubleSide} attach="material"/>
    </mesh>
  );
}

function Cube(props: any) {
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

function Ring(props: any) {
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

function Bolt(props: any) {
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

function Circle(props: any) {
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

function Racecar(props: any) {
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

function Noise(props: any) {
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
      vertices[i].z = (props.size*Math.cos(props.n*t))*Math.cos(t);
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
      else {
        lineRef.current.lookAt(new Vector3(newPosition.x, newPosition.y, 1));
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

function Wire(props: any) {
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

export default class App extends React.Component<any, any> {
  private dbUrl: string;
  private isLocalHost: Boolean;
  private sliderLabels: Record<string, SliderOptions> = {
    'standard': {
      param1: 'Bars',
      param2: '',
      offset: 'Spread',
      spread: 'Height',
    },
    'standardRing': {
      param1: 'Bars',
      param2: 'Radius',
      offset: 'Spread',
      spread: 'Height',
    },
    'foldingRing': {
      param1: 'Bars',
      param2: 'Radius',
      offset: 'Spread',
      spread: 'Height',
    },
    'horizontalLines': {
      param1: '',
      param2: '',
      offset: 'Offset',
      spread: 'Spread',
    },
    'verticalLines': {
      param1: '',
      param2: '',
      offset: 'Offset',
      spread: 'Spread',
    },
    'circular': {
      param1: 'n',
      param2: 'Radius',
      offset: '',
      spread: '',
    },
    'bolt': {
      param1: '',
      param2: '',
      offset: '',
      spread: '',
    },
    'rings': {
      param1: 'n',
      param2: 'Radius',
      offset: '',
      spread: '',
    },
    'fractal': {
      param1: 'n',
      param2: 'Radius',
      offset: '',
      spread: '',
    },
    'solid': {
      param1: '',
      param2: '',
      offset: '',
      spread: '',
    },
    'cube': {
      param1: '',
      param2: '',
      offset: '',
      spread: '',
    },
    'wires': {
      param1: '',
      param2: '',
      offset: '',
      spread: 'Spread',
    },
    'flat': {
      param1: '',
      param2: '',
      offset: '',
      spread: 'Spread',
    },
    'racecar': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'trails': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'slide': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'noise': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'racecar_off': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'trails_off': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'slide_off': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    },
    'noise_off': {
      param1: 'n',
      param2: 'Scale',
      offset: 'Path',
      spread: 'Speed',
    }
  };

  constructor(props: any) {
    super(props);
    this.state = {
      analyzer: null, 
      visualizerType: "standard",
      spread: 1,
      offset: 1.3,
      param1: 2,
      param2: 0.2,
      colorIndex: 0,
      presetName: "",
      selectedPreset: 0,
      presets: []
    };
    this.dbUrl = "http://localhost:3001/presets";
    this.isLocalHost  = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(
          /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );
  }

  componentDidMount(){
    navigator.mediaDevices.getUserMedia({audio: true })
      .then(this.handleAudio)
      .catch(this.audioError);
    this.fetchPresets().then(this.randomPreset);
  }

  fetchPresets(){
    if (!this.isLocalHost){
      return fetch('presetDb.json', {
        headers : { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
         }
      }
      )
        .then(function(response){
          return response.json();
        })
        .then((json) => {
          this.setState({presets: json.presets});
        });
    }
    else {
      return axios.get(this.dbUrl).then((resp) => {
        this.setState({presets: resp.data})
      });
    }
  }

  initializeAudioAnalyser = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    this.setState({
      analyzer: analyser
    })
  }

  handleAudio = (stream: MediaStream) => {
    this.initializeAudioAnalyser(stream);
  }

  audioError = (err: any) => {
    console.log(err);
    alert("Something went wrong: " + err.name);
  }

  getColor(index: number, total: number){
    return "#" + Math.random().toString(16).slice(2, 8);
  }

  standard(height: number, spread: number, bins: number, width: number) {
    const maxX = 18;
    let binWidth = Math.floor(1024/bins);
    let boxes = [];
    for (let i=0; i<bins; i++){
      let boxWidth = ((maxX*2.0)/bins) - spread;
      let x = - (maxX+(maxX/bins)) + (2*maxX/bins)*(i+1);
      boxes.push(<StandardBox analyzer={this.state.analyzer} width={boxWidth} height={height} position={[x,0.5,-10]} color={this.getColor(i, bins)} freqRange={{start: binWidth*i, end: binWidth*i+binWidth-1}} />)
    }
    return (
      <>
        {boxes}
      </>
      
    )
  }

  standardRing(height: number, spread: number, bins: number, radius: number, extraRot: number) {
    let binWidth = Math.floor(1024/bins);
    let boxes = [];
    for (let i=0; i<bins; i++){
      let theta = i*Math.PI*2/bins;
      let x = radius*Math.cos(theta);
      let y = radius*Math.sin(theta);
      boxes.push(<StandardBox analyzer={this.state.analyzer} width={spread} height={height} position={[x,y,-10]} color={this.getColor(i, bins)} freqRange={{start: binWidth*i, end: binWidth*i+binWidth-1}} rot={Math.PI + theta + (Math.PI/2)*extraRot}/>)
    }
    return (
      <>
        {boxes}
      </>
      
    )
  }

  horizontalLines(offset: number, spread: number) {
    return (
      <>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[0]} position={[0, (spread*-2) - offset, -1]} freqRange={{start: 0, end:  2}}/>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[1]} position={[0, (spread*-1) - offset, -1]} freqRange={{start: 4,  end:  10}}/>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[2]} position={[0, 0 - offset, -1]}  freqRange={{start: 13, end:  22}}/>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[3]} position={[0, (spread*1) - offset, -1]} freqRange={{start: 40, end:  88}}/>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[4]} position={[0, (spread*2) - offset, -1]} freqRange={{start: 100, end:  256}}/>
        <HorizontalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[5]} position={[0, (spread*3) - offset, -1]} freqRange={{start: 280, end:  500}}/>
      </>
    )
  }

  solidColor() {
    return (
      <>
        <Plane analyzer={this.state.analyzer} position={[0,0,0]} />
      </>
    )
  }

  cube() {
    return (
      <>
        <Cube analyzer={this.state.analyzer} position={[0,0,0]} />
      </>
    )
  }

  bolt() {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    const scaleRate=0.01;
    return (
      <>
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Bolt analyzer={this.state.analyzer} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
      </>
    )
  }

  circular(n: number, ringWidth: number) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    const scaleRate=0.01;
    return (
      <>
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Circle analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
      </>
    )
  }

  Racecar(n: number, size: number, speed: number, lineWidth: number, loop: boolean, seperate: boolean, offaxis?: boolean) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    const scaleRate=0.01;
    return (
      <>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Racecar analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} loop={loop} seperate={seperate} offaxis={offaxis}/>
      </>
    )
  }

  Noise(n: number, size: number, speed: number, lineWidth: number, loop: boolean, seperate: boolean, offaxis?: boolean) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    const scaleRate=0.01;
    return (
      <>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} loop={loop} seperate={seperate} offaxis={offaxis}/>
        <Noise analyzer={this.state.analyzer} n={n} size={size} speed={speed} lineWidth={lineWidth} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} loop={loop} seperate={seperate} offaxis={offaxis}/>
      </>
    )
  }

  rings(ringSize: number, indexStart: number, n: number, ringWidth: number) {
    const numRings = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numRings;
    const scaleRate=0.01;
    return (
      <>
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Ring analyzer={this.state.analyzer} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
      </>
    )
  }

  verticalLines(offset: number, spread: number) {
    return (
      <>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[0]} position={[(spread*-2) - offset, 0, -1]} freqRange={{start: 0, end:  2}}/>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[1]} position={[(spread*-1) - offset, 0, -1]} freqRange={{start: 4,  end:  10}}/>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[2]} position={[ 0 - offset, 0, -1]}  freqRange={{start: 13, end:  22}}/>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[3]} position={[(spread*1) - offset, 0, -1]} freqRange={{start: 40, end:  88}}/>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[4]} position={[(spread*2) - offset, 0, -1]} freqRange={{start: 100, end:  256}}/>
        <VerticalLine analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_6[5]} position={[(spread*3) - offset, 0, -1]} freqRange={{start: 280, end:  500}}/>
      </>
    )
  }

  wires(spread: number, flat: boolean) {
    return (
      <>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[0]} freqRange={{start: 0, end:  2}} position = {[0,0,0]} flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[1]} freqRange={{start: 4, end:  10}} position = {[0 + spread,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[2]} freqRange={{start: 12, end:  16}} position = {[0 + spread*2,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[3]} freqRange={{start: 18, end:  22}} position = {[0 + spread*3,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[4]} freqRange={{start: 40, end:  60}} position = {[0 + spread*4,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[5]} freqRange={{start: 62, end:  80}} position = {[0 + spread*5,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[6]} freqRange={{start: 82, end:  100}} position = {[0 + spread*6,0,0]}  flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[7]} freqRange={{start: 100, end:  140}} position = {[0 + spread*7,0,0]} flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[8]} freqRange={{start: 146, end:  190}} position = {[0 + spread*8,0,0]} flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[9]} freqRange={{start: 264, end:  542}} position = {[0 + spread*9,0,0]} flat={flat}/>
        <Wire analyzer={this.state.analyzer} color={ColorPalettes[this.state.colorIndex].palette_11[10]} freqRange={{start: 550, end:  852}} position = {[0 + spread*10,0,0]}  flat={flat}/>
      </>
    )
  }

  renderVisualizer(visualizerType: string, spread: number, offset: number, param1: number, param2: number){
    switch(visualizerType) { 
      case "standard": { 
        return this.standard(spread, offset, param1, param2);
      }
      case "standardRing": { 
        return this.standardRing(spread, offset, param1, param2, 1);
      }
      case "foldingRing": { 
        return this.standardRing(spread, offset, param1, param2, 0);
      }
      case "horizontalLines": { 
        return this.horizontalLines(spread, offset);
      }
      case "verticalLines": { 
        return this.verticalLines(spread, offset);
      }
      case "circular": { 
        return this.circular(param1, param2);
      }
      case "bolt": { 
        return this.bolt();
      } 
      case "rings": { 
        return this.rings(0.02, 1, param1, param2);
      } 
      case "fractal": { 
        return this.rings(0.02, 0, param1, param2);
      } 
      case "solid": { 
        return this.solidColor();
      }
      case "cube": { 
        return this.cube();
      }
      case "wires": { 
        return this.wires(spread, false);
      }
      case "flat": { 
        return this.wires(spread, true);
      }
      case "racecar": { 
        return this.Racecar(param1, param2, spread, offset, true, true, false);
      }
      case "trails": { 
        return this.Racecar(param1, param2, spread, offset, true, false, false);
      }
      case "slide": { 
        return this.Racecar(param1, param2, spread, offset, false, false, false);
      }
      case "noise": { 
        return this.Noise(param1, param2, spread, offset, true, true, false);
      }
      case "racecar_off": { 
        return this.Racecar(param1, param2, spread, offset, true, true, true);
      }
      case "trails_off": { 
        return this.Racecar(param1, param2, spread, offset, true, false, true);
      }
      case "slide_off": { 
        return this.Racecar(param1, param2, spread, offset, false, false, true);
      }
      case "noise_off": { 
        return this.Noise(param1, param2, spread, offset, true, true, true);
      }
      default: {
        return this.circular(param1, param2);
      } 
   } 
  }

  visualizerChanged = (e: any) => {
    this.setState({visualizerType: e.target.value});
  }
  
  paletteChanged = (e: any) => {
    this.setState({colorIndex: parseInt(e.target.value)});
  }

  presetNameChanged = (e: any) => {
    this.setState({presetName: e.target.value});
  }
  
  spreadChanged = (e: any, val: any) => {
    this.setState({spread: val});
  }

  offsetChanged = (e: any, val: any) => {
    this.setState({offset: val});
  }

  param1Changed = (e: any, val: any) => {
    this.setState({param1: val});
  }

  param2Changed = (e: any, val: any) => {
    this.setState({param2: val});
  }

  onSavePreset = (e: any) => {
    let state: Preset = {
      presetName: this.state.presetName,
      visualizerType: this.state.visualizerType,
      colorIndex: this.state.colorIndex,
      spread: this.state.spread,
      offset: this.state.offset,
      param1: this.state.param1,
      param2: this.state.param2
    }
    axios.post(this.dbUrl, state).then(()=> {
      this.fetchPresets();
      this.setState({presetName: ""});
    }).catch((err) => console.log(err));
  }

  randomPreset = () => {
    this.onPresetSelected({target: { value: Math.floor(Math.random()*this.state.presets.length)}});
  }

  onPresetSelected = (e: any) => {
    console.log(e);
    let selectedPreset = this.state.presets[e.target.value];
    this.setState({ visualizerType: selectedPreset.visualizerType,
      colorIndex: selectedPreset.colorIndex,
      spread: selectedPreset.spread,
      offset: selectedPreset.offset,
      param1: selectedPreset.param1,
      param2: selectedPreset.param2,
      selectedPreset: e.target.value
    });
  }

  render() {

    const visOptions = [
      { value: 'standard', label: 'Standard' },
      { value: 'standardRing', label: 'Circular' },
      { value: 'foldingRing', label: 'Folding' },
      { value: 'horizontalLines', label: 'Horizontal Lines' },
      { value: 'verticalLines', label: 'Vertical Lines' },
      { value: 'circular', label: 'Circles' },
      { value: 'bolt', label: 'Lightning' },
      { value: 'rings', label: 'Rings' },
      { value: 'solid', label: 'Solid' },
      { value: 'cube', label: 'Cube' },
      { value: 'wires', label: "Wires"},
      { value: 'flat', label: "Flat"},
      { value: 'fractal', label: 'Fractal' },
      { value: 'racecar', label: 'Race' },
      { value: 'trails', label: 'Trails' },
      { value: 'slide', label: 'Slide' },
      { value: 'racecar_off', label: 'Helix' },
      { value: 'trails_off', label: 'Layers' },
      { value: 'slide_off', label: 'Carousel' },
      { value: 'noise', label: 'Noise' },
      { value: 'noise_off', label: 'Static' }
    ];

    // 'standard': {
    //   param1: '',
    //   param2: '',
    //   offset: '',
    //   spread: '',
    // }


    return (
      <>
        <div id="uiContainer">
          <div id="selectContainer">
            <Button onClick={this.randomPreset} variant="contained">
              Random
            </Button>
            <FormControl>
              <InputLabel className='label'>
                Visual
              </InputLabel>
              <Select id="visualizerType"
                  value={this.state.visualizerType}
                  variant="outlined"
                  onChange={this.visualizerChanged}>
                    {visOptions.map((o) => <MenuItem value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel className='label'>
                Color Palette
              </InputLabel>
              <Select id="paletteType"
                value={this.state.colorIndex}
                variant="outlined"
                onChange={this.paletteChanged}>
                  {ColorPalettes.map((p, index) => <MenuItem value={index}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel className='label'>
                Preset
              </InputLabel>
              <Select id="selectedPreset"
                label="Selected Preset"
                value={this.state.selectedPreset}
                variant="outlined"
                onChange={this.onPresetSelected}>
                  {this.state.presets.map((p: Preset, index: any) => <MenuItem value={index}>{p.presetName}</MenuItem>)}
              </Select>
            </FormControl>
            {this.isLocalHost && 
            <>
            <TextField id="presetName"
                value={this.state.presetName}
                placeholder="Preset Name"
                variant="outlined"
                onChange={this.presetNameChanged} 
            />
            <Button id="savePreset" onClick={this.onSavePreset} disabled={this.state.presetName === ""} variant="contained">
              Save
            </Button>
            </>}
          </div>
          <div id="sliderContainer">
            <div id="sliderContainer">
              <FormControl>
                <InputLabel className='label'>
                  {this.sliderLabels[this.state.visualizerType].param1}
                </InputLabel>
                <Slider
                  defaultValue={10}
                  value={this.state.param1}
                  step={1}
                  min={1}
                  max={100}
                  valueLabelDisplay="on"
                  onChange={this.param1Changed}
                />
              </FormControl>
              <FormControl>
                <InputLabel className='label'>
                  {this.sliderLabels[this.state.visualizerType].param2}
                </InputLabel>
                <Slider
                  defaultValue={0.2}
                  value={this.state.param2}
                  step={0.1}
                  min={0}
                  max={3}
                  valueLabelDisplay="on"
                  onChange={this.param2Changed}
                />
              </FormControl>  
            </div>
            <div id="sliderContainer">
              <FormControl>
                <InputLabel className='label'>
                  {this.sliderLabels[this.state.visualizerType].spread}
                </InputLabel>
                <Slider
                  defaultValue={10}
                  value={this.state.spread}
                  step={0.5}
                  min={0}
                  max={1000}
                  valueLabelDisplay="on"
                  onChange={this.spreadChanged}
                />
              </FormControl>
              <FormControl>
                <InputLabel className='label'>
                  {this.sliderLabels[this.state.visualizerType].offset}
                </InputLabel>
                <Slider
                  defaultValue={0.2}
                  value={this.state.offset}
                  step={0.1}
                  min={0}
                  max={20}
                  valueLabelDisplay="on"
                  onChange={this.offsetChanged}
                />
              </FormControl>   
            </div>
          </div>
        </div>
        <Canvas className={'App'}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {this.renderVisualizer(this.state.visualizerType, this.state.spread, this.state.offset, this.state.param1, this.state.param2)}
        </Canvas>
      </>
      
    )
  }
}