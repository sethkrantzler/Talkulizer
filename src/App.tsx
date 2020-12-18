import ReactDOM from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useResource, useThree } from 'react-three-fiber';
import { BufferGeometry, Color, LineBasicMaterial, Mesh, Points, Scene, Vector2} from 'three';
import './App.css';
import { MenuItem, Select } from '@material-ui/core';

interface FrequencyRange {
  start: number;
  end: number;
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

export default class App extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.state = {analyzer: null, visualizerType: "horizontalLines"};
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

  horizontalLines() {
    const offset = 0;
    const spread = 1.3;
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

  verticalLines() {
    const offset = 1;
    const spread = 1.3;
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

  renderVisualizer(visualizerType: string){
    switch(visualizerType) { 
      case "horizontalLines": { 
        return this.horizontalLines();
        break; 
      }
      case "verticalLines": { 
        return this.verticalLines();
        break; 
      } 
      default: {
        return this.horizontalLines();
        break; 
      } 
   } 
  }

  visualizerChanged = (e: any) => {
    this.setState({visualizerType: e.target.value});
  }

  render() {

    const options = [
      { value: 'horizontalLines', label: 'Horizontal Lines' },
      { value: 'verticalLines', label: 'Vertical Lines' }
    ];

    return (
      <>
        <Select id="visualizerType"
            value={this.state.visualizerType}
            onChange={this.visualizerChanged}>
              {options.map((o) => <MenuItem value={o.value}>{o.label}</MenuItem>)}
        </Select>
        <Canvas className={'App'}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {this.renderVisualizer(this.state.visualizerType)}
        </Canvas>
      </>
      
    )
  }
}