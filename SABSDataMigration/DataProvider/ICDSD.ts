import { IField } from "../Component";

export default interface ICDS {
  getItems(entity: string, fields: IField[], filter?: string): Promise<any>;
  closecase(incident: any): Promise<any>;
  getactivecases(top?: number): Promise<any>
}
