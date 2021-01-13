export const vectorToAngle = (x: number, y: number): number => {
    return Math.atan2(x, y)
}

export const calculateAngleBetweenVectors = (x1: number, x2: number, y1: number, y2: number): number => {
    return Math.atan2((x1 - x2), (y1 - y2))
}

export const calculateVectorBetweenVectors = (x1: number, x2: number, y1: number, y2: number): [number, number] => {
    const angle = calculateAngleBetweenVectors(x1, x2, y1, y2)
    return angleToVector(angle)
}

export const angleToVector = (angle: number): [number, number] => {
    const xVector = Math.sin(angle)
    const yVector = Math.cos(angle)

    return [xVector, yVector]
}