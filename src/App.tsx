import ReactDOM from 'react-dom'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useResource, useThree } from 'react-three-fiber'
import { BufferGeometry, Color, LineBasicMaterial, Mesh, Points, Scene, Vector2} from 'three';
import './App.css';

interface FrequencyRange {
  start: number;
  end: number;
}

function Box(props: any) {
  // This reference will give us direct access to the mesh
  const mesh = useRef<Mesh>();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if (mesh && mesh.current){
      mesh.current.rotation.x = mesh.current.rotation.y += 0.01
    }
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

function HorizontalLine(props: any) {
  const geoRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
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

export default class App extends React.Component<any, any> {
  

  constructor(props: any) {
    super(props);
    this.state = {source: '', analyzer: null};
  }

  componentDidMount(){
    navigator.mediaDevices.getUserMedia({audio: true})
      .then(this.handleAudio)
      .catch(this.audioError);
  }

  initializeAudioAnalyser = () => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(this.state.source);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    this.setState({
      analyzer: analyser
    })
  }

  handleAudio = (stream: any) => {
    this.setState({
      source: stream
    })
    this.initializeAudioAnalyser();
  }

  audioError = (err: any) => {
    console.log(err);
    alert("Something went wrong: " + err.name);
  }

  render() {
    return (
      <Canvas className={'App'}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <HorizontalLine analyzer={this.state.analyzer} position={[0, -2.6, -1]} color={'#46237A'} freqRange={{start: 0, end:  2}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, -1.3, -1]} color={'#337CA0'} freqRange={{start: 4,  end:  10}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, 0, -1]} color={'#CFFFB3'} freqRange={{start: 13, end:  22}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, 1.3, -1]} color={'#FFB400'} freqRange={{start: 40, end:  88}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, 2.6, -1]} color={'#EE5622'} freqRange={{start: 100, end:  256}}/>
        <HorizontalLine analyzer={this.state.analyzer} position={[0, 3.9, -1]} color={'white'} freqRange={{start: 500, end:  852}}/>
      </Canvas>
    )
  }
}