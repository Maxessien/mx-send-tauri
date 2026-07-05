import { FileRes, FileResType } from "../types";

class Queue<T> extends EventTarget {
  private elements: T[];
  constructor(initEls: T[] = []) {
    super();
    this.elements = initEls;
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
        .splice(0, idx)
        .concat(this.elements.splice(idx + 1));
  }

  modify() {
    return this.elements;
  }
}

export const downloadQueue = new Queue<{ fileId: string; senderId: string }>();
export const uploadQueue = new Queue<{ file: FileRes; type: FileResType }>();

export default Queue;
