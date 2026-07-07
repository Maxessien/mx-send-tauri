import { FileRes, FileResType } from "../types";

class Queue<T> {
  private elements: T[];
  isProcessing: boolean
  constructor(initEls: T[] = []) {
    this.elements = initEls;
    this.isProcessing = false
  }

  traverse() {
    return structuredClone<T[]>(this.elements);
  }

  pop() {
    const el = this.elements[0];
    this.elements = this.elements.slice(1);
    return el;
  }

  push(el: T) {
    this.elements.push(el)
  }

  clear() {
    this.elements = [];
  }

  removeAt(idx: number) {
    if (this.elements[idx])
      this.elements = this.elements
        .slice(0, idx)
        .concat(this.elements.slice(idx + 1));
  }
}

export const downloadQueue = new Queue<{ fileId: string; senderId: string, file: FileRes }>();
export const uploadQueue = new Queue<{ file: FileRes; type: FileResType }>();

export default Queue;
