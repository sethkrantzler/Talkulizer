import ReactDOM from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useResource, useThree, useUpdate } from 'react-three-fiber';
import { BufferGeometry, CircleBufferGeometry, CircleGeometry, Color, EdgesGeometry, Geometry, LineBasicMaterial, Mesh, Points, Scene, Vector2, DoubleSide, CubicBezierCurve3, Vector3, QuadraticBezierCurve3} from 'three';
import './App.css';
import { Input, MenuItem, Select, TextField } from '@material-ui/core';

interface FrequencyRange {
  start: number;
  end: number;
  color?: string;
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

  function graphFrequencyData(points: Vector2[], freqData: Uint8Array, freqRange: FrequencyRange, waveFunc?: string ) {
    const freqArray = freqData.subarray(freqRange.start, freqRange.end);
    const freqAvg = freqArray.length > 0 ? average(freqArray) : 0;
    for (let i = 0; i < points.length; i++) {
      points[i].y = (Math.pow(2, freqAvg/255.0) - 1)*Math.exp(-Math.abs(points[i].x)*0.65)*Math.cos(2*Math.PI*points[i].x + Date.now() / 400);
    }
    return points;
  }


  useFrame(() => {
    if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray && props.bolt) {
      props.analyzer.getByteFrequencyData(amplitudeArray);
      geoRef.current.setFromPoints(graphFrequencyData(linePoints, amplitudeArray, props.freqRange));
    }
    else if (lineRef && lineRef.current) {
      lineRef.current.scale.set(lineRef.current.scale.x + props.scaleRate, lineRef.current.scale.y + props.scaleRate, lineRef.current.scale.z);
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
      <ringBufferGeometry ref={geoRef} args={[1-(props.ringSize/2.0), 1+(props.ringSize/2.0), 1024]} attach="geometry" />
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
    if (geoRef && geoRef.current && !!props.analyzer && amplitudeArray && props.bolt) {
      props.analyzer.getByteFrequencyData(amplitudeArray);
      geoRef.current.setFromPoints(graphFrequencyData(linePoints, amplitudeArray, props.freqRange));
    }
    else if (lineRef && lineRef.current) {
      lineRef.current.scale.set(lineRef.current.scale.x + props.scaleRate, lineRef.current.scale.y + props.scaleRate, lineRef.current.scale.z);
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
      scale={[props.bolt ? 1 : props.radius, props.bolt ? 1 : props.radius, 1]}>
      <circleBufferGeometry ref={geoRef} args={[1, 1024]} attach="geometry" />
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
    for (let i = 0; i < points.length; i++) {
      if (props.flat) {
        points[i].y = (freqAvg/(255.0*10))*Math.exp(-Math.abs(points[i].z)*0.65)*Math.cos(2*Math.PI*points[i].z);
      }
      points[i].x = (freqAvg/(255.0*10))*Math.exp(-Math.abs(points[i].z)*0.65)*Math.cos(2*Math.PI*points[i].z);
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

  constructor(props: any) {
    super(props);
    this.state = {
      analyzer: null, 
      visualizerType: "wires",
      spread: 1,
      offset: 1.3
    };
  }

  componentDidMount(){
    navigator.mediaDevices.getUserMedia({audio: true})
      .then(this.handleAudio)
      .catch(this.audioError);
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

  horizontalLines(offset: number, spread: number) {
    return (
      <>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, (spread*-2) - offset, -1]} color={'#46237A'} freqRange={{start: 0, end:  2}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, (spread*-1) - offset, -1]} color={'#337CA0'} freqRange={{start: 4,  end:  10}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, 0 - offset, -1]} color={'#CFFFB3'} freqRange={{start: 13, end:  22}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, (spread*1) - offset, -1]} color={'#FFB400'} freqRange={{start: 40, end:  88}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, (spread*2) - offset, -1]} color={'#EE5622'} freqRange={{start: 100, end:  256}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, (spread*3) - offset, -1]} color={'white'} freqRange={{start: 500, end:  852}}/>
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

  circular(bolt: boolean) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    const scaleRate=0.01;
    return (
      <>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={'#46237A'} freqRange={{start: 0, end:  2}} bolt={bolt}/>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={'#FFB400'} freqRange={{start: 4,  end:  10}} bolt={bolt}/>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={'#CFFFB3'} freqRange={{start: 13, end:  22}} bolt={bolt}/>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={'#337CA0'} freqRange={{start: 40, end:  88}} bolt={bolt}/>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={'#EE5622'} freqRange={{start: 100, end:  256}} bolt={bolt}/>
        <Circle analyzer={this.state.analyzer} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={'#3A5311'} freqRange={{start: 500, end:  852}} bolt={bolt}/>
      </>
    )
  }

  rings(ringSize: number) {
    const numRings = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numRings;
    const scaleRate=0.01;
    return (
      <>
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} ringSize={ringSize} color={'#46237A'} freqRange={{start: 0, end:  2}} />
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} ringSize={ringSize} color={'#FFB400'} freqRange={{start: 4,  end:  10}} />
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} ringSize={ringSize} color={'#CFFFB3'} freqRange={{start: 13, end:  22}} />
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} ringSize={ringSize} color={'#337CA0'} freqRange={{start: 40, end:  88}} />
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} ringSize={ringSize} color={'#EE5622'} freqRange={{start: 100, end:  256}} />
        <Ring analyzer={this.state.analyzer} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} ringSize={ringSize} color={'#3A5311'} freqRange={{start: 500, end:  852}} />
      </>
    )
  }

  verticalLines(offset: number, spread: number) {
    return (
      <>
        <VerticalLine analyzer={this.state.analyzer} position={[(spread*-2) - offset, 0, -1]} color={'#46237A'} freqRange={{start: 0, end:  2}}/>
        <VerticalLine analyzer={this.state.analyzer} position={[(spread*-1) - offset, 0, -1]} color={'#337CA0'} freqRange={{start: 4,  end:  10}}/>
        <VerticalLine analyzer={this.state.analyzer} position={[ 0 - offset, 0, -1]} color={'#CFFFB3'} freqRange={{start: 13, end:  22}}/>
        <VerticalLine analyzer={this.state.analyzer} position={[(spread*1) - offset, 0, -1]} color={'#FFB400'} freqRange={{start: 40, end:  88}}/>
        <VerticalLine analyzer={this.state.analyzer} position={[(spread*2) - offset, 0, -1]} color={'#EE5622'} freqRange={{start: 100, end:  256}}/>
        <VerticalLine analyzer={this.state.analyzer} position={[(spread*3) - offset, 0, -1]} color={'white'} freqRange={{start: 500, end:  852}}/>
      </>
    )
  }

  wires(spread: number, flat: boolean) {
    return (
      <>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 0, end:  2}} position = {[0,0,0]} color={'#8D5BFF'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 4, end:  10}} position = {[0 + spread,0,0]} color={'#6D5BFF'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 12, end:  16}} position = {[0 + spread*2,0,0]} color={'#5B8FFF'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 18, end:  22}} position = {[0 + spread*3,0,0]} color={'#5BFFE7'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 40, end:  60}} position = {[0 + spread*4,0,0]} color={'#5BFF76'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 62, end:  80}} position = {[0 + spread*5,0,0]} color={'#CAFF5B'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 82, end:  100}} position = {[0 + spread*6,0,0]} color={'#FFE05B'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 100, end:  140}} position = {[0 + spread*7,0,0]} color={'#FFA75B'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 146, end:  190}} position = {[0 + spread*8,0,0]} color={'#FF6B5B'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 264, end:  542}} position = {[0 + spread*9,0,0]} color={'#FF5B89'} flat={flat}/>
        <Wire analyzer={this.state.analyzer} freqRange={{start: 550, end:  852}} position = {[0 + spread*10,0,0]} color={'#FF2E37'} flat={flat}/>
      </>
    )
  }

  renderVisualizer(visualizerType: string, spread: number, offset: number){
    switch(visualizerType) { 
      case "horizontalLines": { 
        return this.horizontalLines(spread, offset);
      }
      case "verticalLines": { 
        return this.verticalLines(spread, offset);
      }
      case "circular": { 
        return this.circular(false);
      }
      case "bolt": { 
        return this.circular(true);
      } 
      case "rings": { 
        return this.rings(0.02);
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
      default: {
        return this.circular(true);
      } 
   } 
  }

  visualizerChanged = (e: any) => {
    this.setState({visualizerType: e.target.value});
  }

  spreadChanged = (e: any) => {
    this.setState({spread: e.target.value});
  }

  offsetChanged = (e: any) => {
    this.setState({offset: e.target.value});
  }

  render() {

    const options = [
      { value: 'horizontalLines', label: 'Horizontal Lines' },
      { value: 'verticalLines', label: 'Vertical Lines' },
      { value: 'circular', label: 'Circles' },
      { value: 'bolt', label: 'Lightning' },
      { value: 'rings', label: 'Rings' },
      { value: 'solid', label: 'Solid' },
      { value: 'cube', label: 'Cube' },
      { value: 'wires', label: "Wires"},
      { value: 'flat', label: "Flat"}
    ];

    return (
      <>
        <Select id="visualizerType"
            value={this.state.visualizerType}
            onChange={this.visualizerChanged}>
              {options.map((o) => <MenuItem value={o.value}>{o.label}</MenuItem>)}
        </Select>
        <TextField id="spread"
            value={this.state.spread}
            onChange={this.spreadChanged} 
        />
        <TextField id="offset"
            value={this.state.offset}
            onChange={this.offsetChanged} 
        />
        <Canvas className={'App'}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {this.renderVisualizer(this.state.visualizerType, this.state.spread, this.state.offset)}
        </Canvas>
      </>
      
    )
  }
}