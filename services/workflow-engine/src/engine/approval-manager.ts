import { PrismaClient } from '@prisma/client';

export class ApprovalManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createApproval(params: {
    shopId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    currentData: any;
    proposedData: any;
    confidence?: number;
    reasoning?: string;
    priority?: number;
  }) {
    // Check if should auto-approve based on confidence
    const shouldAutoApprove = params.confidence && params.confidence > 0.85;

    const approval = await this.prisma.approvalQueue.create({
      data: {
        shopId: params.shopId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        currentData: JSON.stringify(params.currentData),
        proposedData: JSON.stringify(params.proposedData),
        confidence: params.confidence,
        reasoning: params.reasoning,
        priority: params.priority || 0,
        status: shouldAutoApprove ? 'approved' : 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reviewedAt: shouldAutoApprove ? new Date() : undefined,
        reviewedBy: shouldAutoApprove ? 'system_auto_approve' : undefined,
      },
    });

    // If auto-approved, execute immediately
    if (shouldAutoApprove) {
      await this.executeApprovedAction(approval);
    }

    return approval;
  }

  async approveItem(approvalId: string, reviewedBy: string) {
    const approval = await this.prisma.approvalQueue.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    // Execute the approved action
    await this.executeApprovedAction(approval);

    return approval;
  }

  async rejectItem(approvalId: string, reviewedBy: string, notes?: string) {
    return this.prisma.approvalQueue.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy,
        reviewNotes: notes,
      },
    });
  }

  async getPendingApprovals(shopId: string) {
    return this.prisma.approvalQueue.findMany({
      where: {
        shopId,
        status: 'pending',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async bulkApprove(approvalIds: string[], reviewedBy: string) {
    const results = [];

    for (const id of approvalIds) {
      try {
        const approval = await this.approveItem(id, reviewedBy);
        results.push({ id, success: true, data: approval });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async bulkReject(approvalIds: string[], reviewedBy: string, notes?: string) {
    return this.prisma.approvalQueue.updateMany({
      where: {
        id: { in: approvalIds },
      },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy,
        reviewNotes: notes,
      },
    });
  }

  async expireOldApprovals() {
    return this.prisma.approvalQueue.updateMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
      },
    });
  }

  private async executeApprovedAction(approval: any) {
    // This would integrate with Shopify GraphQL API
    // For now, just log the action
    console.log(`Executing approved action for ${approval.entityType} ${approval.entityId}`);

    // Parse proposed data
    const proposedData = JSON.parse(approval.proposedData);

    // Based on actionType, update appropriate table and Shopify
    switch (approval.actionType) {
      case 'product_update':
        await this.executeProductUpdate(approval, proposedData);
        break;
      case 'price_change':
        await this.executePriceChange(approval, proposedData);
        break;
      case 'inventory_adjust':
        await this.executeInventoryAdjust(approval, proposedData);
        break;
      default:
        console.warn(`Unknown action type: ${approval.actionType}`);
    }
  }

  private async executeProductUpdate(approval: any, proposedData: any) {
    // Update ProductOptimization status
    // Call Shopify API to apply changes
    console.log('Executing product update:', proposedData);
  }

  private async executePriceChange(approval: any, proposedData: any) {
    // Update PriceOptimization status
    // Call Shopify API to update price
    console.log('Executing price change:', proposedData);
  }

  private async executeInventoryAdjust(approval: any, proposedData: any) {
    // Update inventory records
    // Call Shopify API to adjust inventory
    console.log('Executing inventory adjustment:', proposedData);
  }
}
