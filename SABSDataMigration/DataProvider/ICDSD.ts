import { IField } from "../Component";

export default interface ICDS {
  getItems(entity: string, fields: IField[], filter?: string): Promise<any>;
  closecase(incident: any): Promise<any>;
  getactivecases(top?: number): Promise<any>;
  getitembysabsid(entity: string, sabsid: string): Promise<any>;
  deactivateitem(entity: string, sabsid: string, deactivate?: boolean): Promise<any>;
}
