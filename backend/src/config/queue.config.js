// src/config/queue.config.js
import { Queue, Worker } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { prisma } from './prisma.config.js';

// Redis connection config
const redisConnection = {
  host: 'localhost',
  port: 6379,
};

// ============================================
// QUEUE DEFINITIONS
// ============================================

// Dispatch queue for handling dispatch creation
export const dispatchQueue = new Queue('dispatch-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 200, // Keep last 200 failed jobs
    },
  },
});

// Notification queue for handling notifications
export const notificationQueue = new Queue('notification-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
    removeOnComplete: {
      count: 50,
      age: 12 * 3600,
    },
  },
});

// ============================================
// WORKERS
// ============================================

// Dispatch Worker
const dispatchWorker = new Worker(
  'dispatch-queue',
  async (job) => {
    console.log(`[Dispatch Worker] Processing job ${job.id}:`, job.name);

    try {
      switch (job.name) {
        case 'create-auto-dispatch':
          return await processAutoDispatch(job.data);
        
        case 'create-manual-dispatch':
          return await processManualDispatch(job.data);
        
        case 'update-dispatch-status':
          return await processDispatchStatusUpdate(job.data);
        
        case 'cancel-dispatch':
          return await processCancelDispatch(job.data);
        
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`[Dispatch Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Notification Worker
const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    console.log(`[Notification Worker] Processing job ${job.id}:`, job.name);

    try {
      const { notifications } = job.data;
      
      // Create all notifications
      const created = await Promise.all(
        notifications.map(notif => 
          prisma.notification.create({ data: notif })
        )
      );

      return {
        success: true,
        created: created.length,
      };
    } catch (error) {
      console.error(`[Notification Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

// ============================================
// JOB PROCESSORS
// ============================================

async function processAutoDispatch(data) {
  const {
    wasteAnalysisId,
    waste,
    team,
    availableTruck,
    scheduledDate,
    estimatedArrival,
    isQueued,
    queueInfo,
    requiredSpecialization,
  } = data;

  // Create dispatch
  const dispatch = await prisma.dispatch.create({
    data: {
      dispatch_wasteAnalysisId: waste.waste_id,
      dispatch_assignedTeamId: team.team_id,
      dispatch_assignedTruckId: availableTruck.truck_id,
      dispatch_locationLongitude: waste.waste_locationLongitude,
      dispatch_locationLatitude: waste.waste_locationLatitude,
      dispatch_locationAddress: waste.waste_locationAddress,
      dispatch_status: 'assigned',
      dispatch_scheduledDate: new Date(scheduledDate),
      dispatch_estimatedArrival: new Date(estimatedArrival),
      dispatch_priority: 'normal',
    },
  });

  // Update waste status
  await prisma.wasteAnalysis.update({
    where: { waste_id: waste.waste_id },
    data: { waste_status: 'dispatched' },
  });

  // Update truck status only if not queued
  if (!isQueued) {
    await prisma.truck.update({
      where: { truck_id: availableTruck.truck_id },
      data: { truck_status: 'in_use' },
    });
  }

  // Queue notifications
  await queueNotifications(dispatch, team, availableTruck, waste, isQueued, queueInfo, requiredSpecialization);

  return {
    success: true,
    dispatchId: dispatch.dispatch_id,
    isQueued,
  };
}

async function processManualDispatch(data) {
  const {
    wasteAnalysisId,
    teamId,
    truckId,
    scheduledDate,
    priority,
    waste,
    team,
    truck,
    adminUserId,
  } = data;

  const pickupDate = new Date(scheduledDate);
  const estimatedArrival = new Date(pickupDate);
  estimatedArrival.setHours(estimatedArrival.getHours() + 2);

  // Create dispatch
  const dispatch = await prisma.dispatch.create({
    data: {
      dispatch_wasteAnalysisId: waste.waste_id,
      dispatch_assignedTeamId: team.team_id,
      dispatch_assignedTruckId: truck.truck_id,
      dispatch_locationLongitude: waste.waste_locationLongitude,
      dispatch_locationLatitude: waste.waste_locationLatitude,
      dispatch_locationAddress: waste.waste_locationAddress,
      dispatch_status: 'assigned',
      dispatch_scheduledDate: pickupDate,
      dispatch_estimatedArrival: estimatedArrival,
      dispatch_priority: priority || 'normal',
    },
  });

  // Update waste status
  await prisma.wasteAnalysis.update({
    where: { waste_id: waste.waste_id },
    data: { waste_status: 'dispatched' },
  });

  // Update truck status
  await prisma.truck.update({
    where: { truck_id: truck.truck_id },
    data: { truck_status: 'in_use' },
  });

  // Queue notifications
  await queueNotifications(dispatch, team, truck, waste, false, null, null, adminUserId);

  return {
    success: true,
    dispatchId: dispatch.dispatch_id,
  };
}

async function processDispatchStatusUpdate(data) {
  const { dispatchId, status, collectionNotes, userId } = data;

  const dispatch = await prisma.dispatch.findUnique({
    where: { dispatch_id: dispatchId },
    include: {
      dispatch_wasteAnalysis: true,
      dispatch_assignedTeam: true,
      dispatch_assignedTruck: true,
    },
  });

  if (!dispatch) {
    throw new Error('Dispatch not found');
  }

  const updateData = { dispatch_status: status };
  if (collectionNotes) {
    updateData.dispatch_collectionNotes = collectionNotes;
  }

  // Handle completion
  if (status === 'collected' || status === 'completed') {
    const pointsToAward = 50;
    updateData.dispatch_actualCollectionDate = new Date();
    updateData.dispatch_collectionVerified = true;
    updateData.dispatch_pointsAwarded = pointsToAward;

    // Update waste status
    await prisma.wasteAnalysis.update({
      where: { waste_id: dispatch.dispatch_wasteAnalysisId },
      data: { waste_status: 'collected' },
    });

    // Award points
    await prisma.user.update({
      where: { user_id: dispatch.dispatch_wasteAnalysis.waste_analysedBy },
      data: { user_points: { increment: pointsToAward } },
    });

    // Create reward record
    await prisma.reward.create({
      data: {
        reward_userId: dispatch.dispatch_wasteAnalysis.waste_analysedBy,
        reward_wasteAnalysisId: dispatch.dispatch_wasteAnalysisId,
        reward_pointsEarned: pointsToAward,
        reward_reason: 'cleanup_verified',
        reward_transactionType: 'credit',
      },
    });

    // Free truck
    await prisma.truck.update({
      where: { truck_id: dispatch.dispatch_assignedTruckId },
      data: { truck_status: 'available' },
    });
  }

  const updatedDispatch = await prisma.dispatch.update({
    where: { dispatch_id: dispatchId },
    data: updateData,
  });

  return {
    success: true,
    dispatch: updatedDispatch,
  };
}

async function processCancelDispatch(data) {
  const { dispatchId, adminUserId } = data;

  const dispatch = await prisma.dispatch.findUnique({
    where: { dispatch_id: dispatchId },
    include: {
      dispatch_wasteAnalysis: true,
    },
  });

  if (!dispatch) {
    throw new Error('Dispatch not found');
  }

  // Free resources
  await prisma.wasteAnalysis.update({
    where: { waste_id: dispatch.dispatch_wasteAnalysisId },
    data: { waste_status: 'pending_dispatch' },
  });

  await prisma.truck.update({
    where: { truck_id: dispatch.dispatch_assignedTruckId },
    data: { truck_status: 'available' },
  });

  // Delete dispatch
  await prisma.dispatch.delete({
    where: { dispatch_id: dispatchId },
  });

  return {
    success: true,
    dispatchId,
  };
}

// ============================================
// HELPER: Queue Notifications
// ============================================

async function queueNotifications(dispatch, team, truck, waste, isQueued, queueInfo, specialization, adminUserId) {
  const notifications = [];

  // User notification
  notifications.push({
    notification_userId: waste.waste_analysedBy,
    notification_entityType: 'dispatch',
    notification_entityId: dispatch.dispatch_id,
    notification_type: 'dispatch_assigned',
    notification_title: isQueued ? 'Pickup Queued 🕐' : 'Pickup Scheduled! 🚚',
    notification_message: isQueued
      ? `Your waste report has been queued with ${team.team_name}. Expected pickup: ${new Date(dispatch.dispatch_scheduledDate).toLocaleDateString()}`
      : `Your waste report has been assigned to ${team.team_name}. Expected pickup: ${new Date(dispatch.dispatch_scheduledDate).toLocaleDateString()}`,
    notification_priority: isQueued ? 'normal' : 'high',
    notification_metadata: {
      dispatchId: dispatch.dispatch_id,
      teamName: team.team_name,
      truckRegistration: truck.truck_registrationNumber,
      scheduledDate: dispatch.dispatch_scheduledDate,
      isQueued,
      queueInfo,
    },
  });

  // Admin notifications
  const admins = await prisma.user.findMany({
    where: { user_role: 'admin' },
    select: { user_id: true },
  });

  admins.forEach((admin) => {
    if (!adminUserId || admin.user_id !== adminUserId) {
      notifications.push({
        notification_userId: admin.user_id,
        notification_entityType: 'dispatch',
        notification_entityId: dispatch.dispatch_id,
        notification_type: 'dispatch_assigned',
        notification_title: isQueued ? 'Dispatch Queued' : 'Dispatch Created',
        notification_message: `${adminUserId ? 'Manual' : 'Automatic'} dispatch for ${team.team_name}`,
        notification_priority: 'normal',
        notification_metadata: {
          dispatchId: dispatch.dispatch_id,
          wasteId: waste.waste_id,
          teamName: team.team_name,
          specialization,
        },
      });
    }
  });

  // Team member notifications
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: team.team_id },
    select: { userId: true },
  });

  teamMembers.forEach((member) => {
    notifications.push({
      notification_userId: member.userId,
      notification_entityType: 'dispatch',
      notification_entityId: dispatch.dispatch_id,
      notification_type: 'dispatch_assigned',
      notification_title: 'New Pickup Assignment 📋',
      notification_message: `New pickup at ${waste.waste_locationAddress}`,
      notification_priority: 'high',
      notification_metadata: {
        dispatchId: dispatch.dispatch_id,
        location: waste.waste_locationAddress,
        scheduledDate: dispatch.dispatch_scheduledDate,
      },
    });
  });

  // Add to notification queue
  await notificationQueue.add('send-notifications', { notifications });
}

// ============================================
// WORKER EVENT HANDLERS
// ============================================

dispatchWorker.on('completed', (job, result) => {
  console.log(`✅ [Dispatch] Job ${job.id} completed:`, result);
});

dispatchWorker.on('failed', (job, err) => {
  console.error(`❌ [Dispatch] Job ${job?.id} failed:`, err.message);
});

notificationWorker.on('completed', (job, result) => {
  console.log(`✅ [Notification] Job ${job.id} completed:`, result);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ [Notification] Job ${job?.id} failed:`, err.message);
});

// ============================================
// BULL BOARD SETUP
// ============================================

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(dispatchQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'EcoSnap Queue Dashboard',
      boardLogo: {
        path: 'https://via.placeholder.com/100x40?text=EcoSnap',
        width: '100px',
        height: '40px',
      },
      miscLinks: [
        { text: 'Back to Admin', url: '/admin' },
      ],
    },
  },
});

export const bullRouter = serverAdapter.getRouter();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

export async function closeQueues() {
  console.log('Closing queue connections...');
  await dispatchQueue.close();
  await notificationQueue.close();
  await dispatchWorker.close();
  await notificationWorker.close();
  console.log('✅ Queues closed');
}