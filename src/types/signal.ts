export type SignalKind = 'boolean' | 'analog';

export interface Signal {
  id: string;
  name: string;
  index: number;
  kind: SignalKind;
  visible: boolean;
}
