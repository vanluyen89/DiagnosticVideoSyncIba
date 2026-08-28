import { create } from 'zustand';
import type { SystemStatus, TimelineEvent } from '@/types';

interface DashboardState {
  projectName: string;
  systemStatus: SystemStatus;
  currentTime: number;
  timelineDuration: number;
  isPlaying: boolean;
  timelineEvents: TimelineEvent[];
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  setSystemStatus: (status: SystemStatus) => void;
}

const initialEvents: TimelineEvent[] = [
  {
    id: '1',
    label: 'System boot',
    timestamp: 0,
    duration: 12,
    type: 'info',
  },
  {
    id: '2',
    label: 'Calibration',
    timestamp: 18,
    duration: 24,
    type: 'success',
  },
  {
    id: '3',
    label: 'Load spike',
    timestamp: 52,
    duration: 16,
    type: 'warning',
  },
  {
    id: '4',
    label: 'Sensor fault',
    timestamp: 78,
    duration: 10,
    type: 'error',
  },
  {
    id: '5',
    label: 'Recovery',
    timestamp: 95,
    duration: 20,
    type: 'success',
  },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  projectName: 'Video diagnostic',
  systemStatus: 'online',
  currentTime: 0,
  timelineDuration: 120,
  isPlaying: false,
  timelineEvents: initialEvents,
  setCurrentTime: (time) => set({ currentTime: time }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSystemStatus: (status) => set({ systemStatus: status }),
}));
