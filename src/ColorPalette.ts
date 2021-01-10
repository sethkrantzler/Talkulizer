interface ColorPalette {
    name: string;
    palette_6: string[];
    palette_11: string[];
}

export const ColorPalettes: ColorPalette[] = [
    {
        name: 'Rainbow',
        palette_6: ["#A800FF", "#0079FF", "#00F11D", "#FFEF00", "#FF7F00", "#FF0900"],
        palette_11: ["#8D5BFF", "#6D5BFF", "#5B8FFF", "#5BFFE7", "#5BFF76", "#CAFF5B", "#FFE05B", "#FFA75B", "#FF6B5B", "#FF5B89", "#FF2E37"]
    },
    {
        name: 'SL2T_1',
        palette_6: ["#46237A", "#FFB400", "#CFFFB3", "#337CA0", "#EE5622", "#3A5311"],
        palette_11: ["#46237A", "#D1B1CB", "#DDCAD9", "#FFB400", "#EE5622", "#337CA0", "3891A6", "#2EC4B6", "#9FC490", "#CFFFB3", "#3A5311"]
    },
    {
        name: 'Cyberpunk',
        palette_6: ["#2d00f7", "#8900f2", "#b100e8", "#db00b6", "#f20089", "#faff00"],
        palette_11: ["#2d00f7", "#6a00f4", "#8900f2", "#a100f2", "#b100e8", "#bc00dd", "#db00b6", "#e500a4", "#f20089", "#faff00", "#faff09"]
    },
    {
        name: 'Ocean',
        palette_6: ["#014f86", "#2c7da0", "#468faf", "#90e0ef", "#ade8f4", "#caf0f8"],
        palette_11: ["#013a63", "#01497c", "#014f86", "#2a6f97", "#2c7da0", "#2c7da0", "#468faf", "#61a5c2", "#89c2d9", "#a9d6e5", "#caf0f8"]
    },
    {
        name: 'Sunset',
        palette_6: ["#d00000", "#dc2f02", "#e85d04", "#f48c06", "#faa307", "#ffba08"],
        palette_11: ["#6a040f","#d00000","#dc2f02", "#dc2f02", "#e85d04", "#f48c06", "#EE5622", "#faa307", "#ffba12", "#ffba08", "#faff00"]
    },
    {
        name: 'Earth',
        palette_6: ["#606c38", "#283618", "#fefae0", "#dda15e", "#bc6c25", "#6a040f"],
        palette_11: ["#606c38", "#ccd5ae", "#e9edc9", "#d4a373", "#edf2f4", "#283618","#faedcd", "#fefae0", "#dda15e", "#bc6c25", "#6a040f"]
    },
]
    