export type Shape = { width: number }

export const area = (shape: Shape): number => shape.width * shape.width

export function perimeter(shape: Shape): number {
  return shape.width * 4
}
