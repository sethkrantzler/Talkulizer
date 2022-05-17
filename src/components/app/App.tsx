import React, { useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import './App.css';
import { MenuItem, Select, TextField, Slider, Button, InputLabel, FormControl } from '@material-ui/core';
import axios from 'axios';
import { ColorPicker } from 'material-ui-color';
import { ColorPalettes } from '../../utils/ColorPalette';
import HelpDialog from '../HelpDialog';
import { SliderOptions, Preset } from '../../interfaces/shared-interfaces';
import { Circle } from '../../visual-functions/Circle';
import { Racecar } from '../../visual-functions/Racecar';
import { Bolt } from '../../visual-functions/Bolt';
import { Plane } from '../../visual-functions/Plane';
import { Cube } from '../../visual-functions/Cube';
import { HorizontalLine } from '../../visual-functions/HorizontalLine';
import { Noise } from '../../visual-functions/Noise';
import { StandardBox } from '../../visual-functions/StandardBox';
import { VerticalLine } from '../../visual-functions/VerticalLine';
import { Wire } from '../../visual-functions/Wire';
import { WaveformLine } from '../../visual-functions/WaveformLine';
import { Ring } from '../../visual-functions/Ring';
import { SliderLabels } from '../../utils/SliderLabels';
extend({ OrbitControls });


const CameraControls = () => {
  const {
    camera,
    gl: { domElement },
  } = useThree();
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef();
  // @ts-ignore
  useFrame((state) => controls.current.update());

  const [enableAutoRotate, setEnableAutoRotate] = useState(false);
  
  useEffect(() => {
    // @ts-ignore
    window.addEventListener('keydown', (e) => { 
      if (e.key == ".") {
        // @ts-ignore
        controls.current?.reset()
      }
      if (e.key == ",") {
        setEnableAutoRotate(enableAutoRotate => !enableAutoRotate);
      }
    });
  }, [controls])
  
  // @ts-ignore
  return <orbitControls ref={controls} args={[camera, domElement]} autoRotate={enableAutoRotate} />;
};

export default class App extends React.Component<any, any> {
  private dbUrl: string;
  private isLocalHost: Boolean; 

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
      presets: [],
      sourceOptions: [],
      shouldCycle: false,
      cycleTime: 2000,
      currentInterval: null,
      bgColor: "#040d1b",
      showHelp: true,
      showUi: true
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
    document.addEventListener("keydown", this.onKeyPressed.bind(this));
  }

  componentWillUnmount(){
    document.removeEventListener("keydown", this.onKeyPressed.bind(this));
  }

  onKeyPressed(e: any) {
    switch(e.key.toLowerCase()){
      case "r":
        this.onPresetSelected({target: { value: Math.floor(Math.random()*this.state.presets.length)}});
        this.showAlertText("Random Preset");
        break;
      case "c":
        this.setState({shouldCycle: !this.state.shouldCycle});
        let alertText = this.state.shouldCycle ? `Cycle (${this.state.cycleTime / 1000}s)` : "Cycle (Off)";
        if (this.state.shouldCycle) {
          this.setCycleInterval(this.state.cycleTime);
        }
        else {
          this.clearCycleInterval();
        }
        this.showAlertText(alertText);
        break;
      case "g":
        this.backgroundChanged("#00ff00");
        this.showAlertText("Green Background");
        break;
      case "b":
        this.backgroundChanged("#0000ff");
        this.showAlertText("Blue Background");
        break;
      case "h":
        this.backgroundChanged(this.getColor(null, null));
        this.showAlertText("Random Background");
        break;
      case "arrowup":
        if (!this.state.shouldCycle){
          break;
        }
        if (this.state.cycleTime < 1000){
          this.setState({cycleTime: 1000});
        }
        else if (this.state.cycleTime >= 30000){
          this.setState({cycleTime: this.state.cycleTime + 5000});
        }
        else {
          this.setState({cycleTime: this.state.cycleTime + 1000});
        }
        this.setCycleInterval(this.state.cycleTime);
        this.showAlertText(`Cycle (${this.state.cycleTime / 1000}s)`);
        break;
      case "arrowdown":
        if (!this.state.shouldCycle){
          break;
        }
        if (this.state.cycleTime <= 1000){
          this.setState({cycleTime: 500});
        }
        else if (this.state.cycleTime >= 30000){
          this.setState({cycleTime: this.state.cycleTime - 5000});
        }
        else {
          this.setState({cycleTime: this.state.cycleTime - 1000});
        }
        this.setCycleInterval(this.state.cycleTime);
        this.showAlertText(`Cycle (${this.state.cycleTime / 1000}s)`);
        break;
      case "u":
        this.toggleUi();
        this.showAlertText(this.state.showUi ? `Toggle UI (On)` : "Toggle UI (Off)");
        break;
      default:
        break;
    }
  }

  clearCycleInterval(){
    if (this.state.currentInterval) {
      clearInterval(this.state.currentInterval);
    }
  }

  setCycleInterval(cycleTime: number){
    if (this.state.currentInterval) {
      clearInterval(this.state.currentInterval);
    }
    this.setState({currentInterval: setInterval(this.randomPreset, cycleTime)});
  }

  setSpeakerAsSource = () => {
    let speaker = new MediaStream;
    const mediaDevices = navigator.mediaDevices as any;
    mediaDevices.getDisplayMedia({
        video: true ,
        audio: true
    }).then((stream: MediaStream) => {
        this.fetchPresets().then(this.randomPreset);
        speaker.addTrack(stream.getAudioTracks()[0].clone());
        // stopping and removing the video track to enhance the performance
        stream.getVideoTracks()[0].stop();
        stream.removeTrack(stream.getVideoTracks()[0]);
        this.handleAudio(speaker);
    }).catch(() => {
        console.error('failed')
    });
    this.setState({showHelp: false})
  }

  setMicrophoneAsSource = () => {
    navigator.mediaDevices.getUserMedia({audio: true })
    .then(this.handleAudio)
    .catch(this.audioError);
    this.fetchPresets().then(this.randomPreset);
    this.setState({showHelp: false})
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

  showAlertText(text: string){
    let alertDiv = document.getElementById("alert-text");
    let child = alertDiv.firstChild;
    if (!!child){
      alertDiv.removeChild(child)
    }
    let textDiv = document.createElement("div");
    textDiv.className = "fade";
    textDiv.innerHTML = text;
    alertDiv.appendChild(textDiv);
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

  standard(height: number, spread: number, bins: number, posY: number) {
    const maxX = 18;
    let binWidth = Math.floor(1024/bins);
    let boxes = [];
    for (let i=0; i<bins; i++){
      let boxWidth = ((maxX*2.0)/bins) - spread;
      let x = - (maxX+(maxX/bins)) + (2*maxX/bins)*(i+1);
      boxes.push(<StandardBox analyzer={this.state.analyzer} width={boxWidth} height={height} position={[x,-posY*2,-10]} color={this.getColor(i, bins)} freqRange={{start: binWidth*i, end: binWidth*i+binWidth-1}} />)
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

  waveform(fidelity: number, height: number, bins: number, z: number) {
    let lines = [];
    const yMax = 2;
    height = height > 0 ? height*2 : 0.1;
    for (let i=0; i<bins; i++){
      let y = - (yMax+(yMax/bins)) + (2*yMax/bins)*(i+1);
      lines.push(<WaveformLine analyzer={this.state.analyzer} position={[0,y,-z]} color={this.getColor(i, bins)} height={height} />);
    };
    return (
      <>
        {lines}
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

  bolt(scaleRate: number = 0.01) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    return (
      <>
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 0]} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 1]} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 2]} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 3]} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 4]} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Bolt analyzer={this.state.analyzer} position={[0, 0, 5]} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
      </>
    )
  }

  circular(n: number, ringWidth: number, scaleRate: number = 0.01) {
    const numCircles = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numCircles;
    return (
      <>
        <Circle analyzer={this.state.analyzer} position={[0, 0, 0]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Circle analyzer={this.state.analyzer} position={[0, 0, 1]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Circle analyzer={this.state.analyzer} position={[0, 0, 2]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Circle analyzer={this.state.analyzer} position={[0, 0, 3]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Circle analyzer={this.state.analyzer} position={[0, 0, 4]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Circle analyzer={this.state.analyzer} position={[0, 0, 5]} n={n} ringWidth={ringWidth} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
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

  rings(ringSize: number, indexStart: number, n: number, ringWidth: number, scaleRate: number = 0.01) {
    const numRings = 6;
    const maxRadius = 10;
    const radiusScale=maxRadius/numRings;
    return (
      <>
        <Ring analyzer={this.state.analyzer} position={[0, 0, 0]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={5*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[0]} freqRange={{start: 0, end:  2}} />
        <Ring analyzer={this.state.analyzer} position={[0, 0, 1]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={4*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[1]} freqRange={{start: 4,  end:  10}} />
        <Ring analyzer={this.state.analyzer} position={[0, 0, 2]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={3*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[2]} freqRange={{start: 13, end:  22}} />
        <Ring analyzer={this.state.analyzer} position={[0, 0, 3]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={2*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[3]} freqRange={{start: 40, end:  88}} />
        <Ring analyzer={this.state.analyzer} position={[0, 0, 4]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={1*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[4]} freqRange={{start: 100, end:  256}} />
        <Ring analyzer={this.state.analyzer} position={[0, 0, 5]} n={n} ringWidth={ringWidth} indexStart={indexStart} scaleRate={scaleRate} radius={0*radiusScale+scaleRate} ringSize={ringSize} color={ColorPalettes[this.state.colorIndex].palette_6[5]} freqRange={{start: 280, end:  500}} />
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
      case "waveform": { 
        return this.waveform(spread, offset, param1, param2);
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
        return this.circular(param1, param2, 0);
      }
      case "bolt": { 
        return this.bolt(0);
      } 
      case "rings": { 
        return this.rings(0.02, 1, param1, param2, 0);
      } 
      case "fractal": { 
        return this.rings(0.02, 0, param1, param2, 0);
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

  backgroundChanged = (color: any) => {
    const colorString = color.css?.backgroundColor || color;
    document.getElementById("root").style.backgroundColor = colorString;
    this.setState({bgColor: colorString});
  }

  toggleUi = () => {
    this.setState({showUi: !this.state.showUi});
    document.getElementById("uiContainer").style.height = this.state.showUi ? "auto" : "0";
    document.getElementById("uiContainer").style.opacity = this.state.showUi ? "1" : "0";

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
      param2: this.state.param2,
      bgColor: this.state.bgColor
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
    let selectedPreset = this.state.presets[e.target.value];
    this.setState({ visualizerType: selectedPreset.visualizerType,
      colorIndex: selectedPreset.colorIndex,
      spread: selectedPreset.spread,
      offset: selectedPreset.offset,
      param1: selectedPreset.param1,
      param2: selectedPreset.param2,
      selectedPreset: e.target.value
    });
    this.backgroundChanged(this.state.bgColor !== '#00ff00' && this.state.bgColor !== '#0000ff' &&  !!selectedPreset.bgColor ? selectedPreset.bgColor : this.state.bgColor);
  }

  randomCycle = () => {
    if (this.state.shouldCycle){
      this.randomPreset();
    }
  }

  helpClicked = () => {
    this.setState({showHelp: !this.state.showHelp});
  }

  render() {
    const visOptions = [
      { value: 'standard', label: 'Standard' },
      { value: 'waveform', label: 'Waveform' },
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

    return (
      <>
        <div id="uiContainer">
          <div id="selectContainer">
            <Button onClick={this.helpClicked} variant="contained">
              Options
            </Button>
            <FormControl id="colorPicker">
              <InputLabel className='label MuiFormLabel-root MuiInputLabel-root label MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiFormLabel-filled' id="colorPickerLabel">
                Background
              </InputLabel>
              <ColorPicker
                defaultValue={this.state.bgColor}
                value={this.state.bgColor}
                onChange={this.backgroundChanged}
              />
            </FormControl>
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
                Palette
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
            <Button onClick={this.randomPreset} variant="contained">
              Random
            </Button>
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
                  {SliderLabels[this.state.visualizerType].param1}
                </InputLabel>
                <Slider
                  defaultValue={10}
                  value={this.state.param1}
                  step={1}
                  min={1}
                  max={100}
                  valueLabelDisplay="auto"
                  onChange={this.param1Changed}
                />
              </FormControl>
              <FormControl>
                <InputLabel className='label'>
                  {SliderLabels[this.state.visualizerType].param2}
                </InputLabel>
                <Slider
                  defaultValue={0.2}
                  value={this.state.param2}
                  step={0.1}
                  min={0}
                  max={3}
                  valueLabelDisplay="auto"
                  onChange={this.param2Changed}
                />
              </FormControl>  
            </div>
            <div id="sliderContainer">
              <FormControl>
                <InputLabel className='label'>
                  {SliderLabels[this.state.visualizerType].spread}
                </InputLabel>
                <Slider
                  defaultValue={10}
                  value={this.state.spread}
                  step={0.5}
                  min={0}
                  max={1000}
                  valueLabelDisplay="auto"
                  onChange={this.spreadChanged}
                />
              </FormControl>
              <FormControl>
                <InputLabel className='label'>
                  {SliderLabels[this.state.visualizerType].offset}
                </InputLabel>
                <Slider
                  defaultValue={0.2}
                  value={this.state.offset}
                  step={0.1}
                  min={0}
                  max={20}
                  valueLabelDisplay="auto"
                  onChange={this.offsetChanged}
                />
              </FormControl>   
            </div>
          </div>
          <HelpDialog
            open={this.state.showHelp}
            close={() => this.setState({showHelp: false})}
            setMicAsInput={this.setMicrophoneAsSource}
            setSpeakerAsInput={this.setSpeakerAsSource}   
          />
        </div>
        <Canvas onKeyDown={this.onKeyPressed} className={'App'}>
          <CameraControls />
          <ambientLight intensity={0.5} />
          {this.renderVisualizer(this.state.visualizerType, this.state.spread, this.state.offset, this.state.param1, this.state.param2)}
        </Canvas>
        <div id="alert-text"></div>
      </>
    )
  }
}