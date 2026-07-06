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

  removeEl(el: T) {
    const idx = this.elements.indexOf(el)
    if (idx >= 0) this.removeAt(idx)
  }
}

export const downloadQueue = new Queue<{ fileId: string; senderId: string }>();
export const uploadQueue = new Queue<{ file: FileRes; type: FileResType }>();

export default Queue;
