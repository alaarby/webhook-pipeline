// src/types/index.ts

export interface Pipeline {
  id: string;
  name: string;
  sourcePath: string;
  signingSecret: string;
  actionType: string;
  createdAt: Date;
}

export interface Job {
  id: string;
  pipelineId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: any;
  result?: any;
  createdAt: Date;
}

export type ActionType = 'TRANSFORM_UPPERCASE' | 'FILTER_SENSITIVE' | 'ADD_TIMESTAMP';