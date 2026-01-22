import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApprovalManager } from './engine/approval-manager.js';
import type { ServiceResponse } from '@shopify-automation/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const approvalManager = new ApprovalManager();

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'workflow-engine', port: PORT });
});

app.post('/create-approval', async (req: Request, res: Response) => {
  try {
    const approval = await approvalManager.createApproval(req.body);
    res.json({ success: true, data: approval } as ServiceResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create approval',
      },
    } as ServiceResponse);
  }
});

app.post('/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;
    const approval = await approvalManager.approveItem(id, reviewedBy);
    res.json({ success: true, data: approval } as ServiceResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVAL_FAILED',
        message: error instanceof Error ? error.message : 'Failed to approve item',
      },
    } as ServiceResponse);
  }
});

app.post('/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy, notes } = req.body;
    const approval = await approvalManager.rejectItem(id, reviewedBy, notes);
    res.json({ success: true, data: approval } as ServiceResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to reject item',
      },
    } as ServiceResponse);
  }
});

app.get('/approvals/pending/:shopId', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const approvals = await approvalManager.getPendingApprovals(shopId);
    res.json({ success: true, data: approvals } as ServiceResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch approvals',
      },
    } as ServiceResponse);
  }
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  } as ServiceResponse);
});

app.listen(PORT, () => {
  console.log(`🚀 Workflow Engine running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
