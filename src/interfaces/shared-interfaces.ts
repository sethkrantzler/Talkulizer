export interface FrequencyRange {
    start: number;
    end: number;
    color?: string;
  }
  
export  interface SliderOptions{
    param1: string;
    param2: string;
    offset: string;
    spread: string;
  }
  
export  interface Preset {
    presetName: string;
    visualizerType: string,
    colorIndex: number,
    spread: number,
    offset: number,
    param1: number,
    param2: number,
    bgColor: string
  }