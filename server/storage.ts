import {
  users,
  type User,
  type UpsertUser,
  departments,
  type Department,
  type InsertDepartment,
  employees,
  type Employee,
  type InsertEmployee,
  trainingModules,
  type TrainingModule,
  type InsertTrainingModule,
  trainingAssignments,
  type TrainingAssignment,
  type InsertTrainingAssignment,
  onboardingTasks,
  type OnboardingTask,
  type InsertOnboardingTask,
  employeeTasks,
  type EmployeeTask,
  type InsertEmployeeTask,
  auditLogs,
  type AuditLog,
  type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, lte, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Department operations
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Employee operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getOnboardingEmployees(): Promise<any[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  
  // Training module operations
  getAllTrainingModules(): Promise<TrainingModule[]>;
  getTrainingModule(id: number): Promise<TrainingModule | undefined>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  
  // Training assignment operations
  getAllTrainingAssignments(): Promise<any[]>;
  getTrainingAssignmentsByEmployee(employeeId: number): Promise<any[]>;
  getTrainingAssignmentsByModule(moduleId: number): Promise<any[]>;
  createTrainingAssignment(assignment: InsertTrainingAssignment): Promise<TrainingAssignment>;
  updateTrainingProgress(id: number, progress: number): Promise<TrainingAssignment>;
  completeTrainingAssignment(id: number): Promise<TrainingAssignment>;
  
  // Onboarding task operations
  getAllOnboardingTasks(): Promise<OnboardingTask[]>;
  createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask>;
  
  // Employee task operations
  getAllEmployeeTasks(): Promise<any[]>;
  getUpcomingTasks(): Promise<any[]>;
  getEmployeeTasksByEmployee(employeeId: number): Promise<any[]>;
  createEmployeeTask(task: InsertEmployeeTask): Promise<EmployeeTask>;
  completeEmployeeTask(id: number): Promise<EmployeeTask>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  getRecentAuditLogs(): Promise<AuditLog[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Department operations
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }
  
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }
  
  async createDepartment(departmentData: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(departmentData).returning();
    return department;
  }
  
  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }
  
  async getOnboardingEmployees(): Promise<any[]> {
    const result = await db.select({
      employee: employees,
      user: users,
      department: departments,
      completedTasks: sql<number>`COUNT(CASE WHEN ${employeeTasks.status} = 'completed' THEN 1 END)`,
      totalTasks: sql<number>`COUNT(${employeeTasks.id})`,
    })
    .from(employees)
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(employeeTasks, eq(employees.id, employeeTasks.employeeId))
    .where(eq(employees.isOnboarding, true))
    .groupBy(employees.id, users.id, departments.id);
    
    return result.map(r => ({
      id: r.employee.id,
      name: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
      department: r.department?.name,
      startDate: r.employee.startDate,
      progressPercentage: r.totalTasks ? Math.round((r.completedTasks / r.totalTasks) * 100) : 0,
      remainingTasks: r.totalTasks - r.completedTasks,
      profileImageUrl: r.user?.profileImageUrl
    }));
  }
  
  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(employeeData).returning();
    return employee;
  }
  
  // Training module operations
  async getAllTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules);
  }
  
  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return module;
  }
  
  async createTrainingModule(moduleData: InsertTrainingModule): Promise<TrainingModule> {
    const [module] = await db.insert(trainingModules).values(moduleData).returning();
    return module;
  }
  
  // Training assignment operations
  async getAllTrainingAssignments(): Promise<any[]> {
    const result = await db.select({
      assignment: trainingAssignments,
      module: trainingModules,
      employee: employees,
      user: users,
    })
    .from(trainingAssignments)
    .leftJoin(trainingModules, eq(trainingAssignments.moduleId, trainingModules.id))
    .leftJoin(employees, eq(trainingAssignments.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id));
    
    return result.map(r => ({
      ...r.assignment,
      module: r.module,
      employee: {
        ...r.employee,
        name: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
      }
    }));
  }
  
  async getTrainingAssignmentsByEmployee(employeeId: number): Promise<any[]> {
    const result = await db.select({
      assignment: trainingAssignments,
      module: trainingModules,
    })
    .from(trainingAssignments)
    .leftJoin(trainingModules, eq(trainingAssignments.moduleId, trainingModules.id))
    .where(eq(trainingAssignments.employeeId, employeeId));
    
    return result.map(r => ({
      ...r.assignment,
      module: r.module,
    }));
  }
  
  async getTrainingAssignmentsByModule(moduleId: number): Promise<any[]> {
    const result = await db.select({
      assignment: trainingAssignments,
      employee: employees,
      user: users,
    })
    .from(trainingAssignments)
    .leftJoin(employees, eq(trainingAssignments.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .where(eq(trainingAssignments.moduleId, moduleId));
    
    return result.map(r => ({
      ...r.assignment,
      employee: {
        ...r.employee,
        name: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
      }
    }));
  }
  
  async createTrainingAssignment(assignmentData: InsertTrainingAssignment): Promise<TrainingAssignment> {
    const [assignment] = await db.insert(trainingAssignments).values(assignmentData).returning();
    return assignment;
  }
  
  async updateTrainingProgress(id: number, progress: number): Promise<TrainingAssignment> {
    const [assignment] = await db
      .update(trainingAssignments)
      .set({ progress })
      .where(eq(trainingAssignments.id, id))
      .returning();
    return assignment;
  }
  
  async completeTrainingAssignment(id: number): Promise<TrainingAssignment> {
    const [assignment] = await db
      .update(trainingAssignments)
      .set({ 
        completedAt: new Date(),
        progress: 100
      })
      .where(eq(trainingAssignments.id, id))
      .returning();
    return assignment;
  }
  
  // Onboarding task operations
  async getAllOnboardingTasks(): Promise<OnboardingTask[]> {
    return await db.select().from(onboardingTasks);
  }
  
  async createOnboardingTask(taskData: InsertOnboardingTask): Promise<OnboardingTask> {
    const [task] = await db.insert(onboardingTasks).values(taskData).returning();
    return task;
  }
  
  // Employee task operations
  async getAllEmployeeTasks(): Promise<any[]> {
    const result = await db.select({
      task: employeeTasks,
      onboardingTask: onboardingTasks,
      employee: employees,
      assignedUser: users.firstName.as('assignedUserFirstName'),
      assignedUserLastName: users.lastName.as('assignedUserLastName'),
      assignedToUser: {
        firstName: sql<string>`assign_to_user.first_name`,
        lastName: sql<string>`assign_to_user.last_name`,
      }
    })
    .from(employeeTasks)
    .leftJoin(onboardingTasks, eq(employeeTasks.taskId, onboardingTasks.id))
    .leftJoin(employees, eq(employeeTasks.employeeId, employees.id))
    .leftJoin(users, eq(employeeTasks.assignedBy, users.id))
    .leftJoin(users.as('assign_to_user'), eq(employeeTasks.assignedTo, sql`assign_to_user.id`));
    
    return result.map(r => ({
      ...r.task,
      title: r.onboardingTask?.title,
      description: r.onboardingTask?.description,
      employee: r.employee,
      assignedBy: {
        firstName: r.assignedUser,
        lastName: r.assignedUserLastName,
      },
      assignedTo: r.assignedToUser,
    }));
  }
  
  async getUpcomingTasks(): Promise<any[]> {
    const result = await db.select({
      task: employeeTasks,
      onboardingTask: onboardingTasks,
      employee: employees,
      employeeUser: {
        firstName: sql<string>`employee_user.first_name`,
        lastName: sql<string>`employee_user.last_name`,
      },
      assignedToUser: {
        firstName: sql<string>`assign_to_user.first_name`,
        lastName: sql<string>`assign_to_user.last_name`,
      }
    })
    .from(employeeTasks)
    .leftJoin(onboardingTasks, eq(employeeTasks.taskId, onboardingTasks.id))
    .leftJoin(employees, eq(employeeTasks.employeeId, employees.id))
    .leftJoin(users.as('employee_user'), eq(employees.userId, sql`employee_user.id`))
    .leftJoin(users.as('assign_to_user'), eq(employeeTasks.assignedTo, sql`assign_to_user.id`))
    .where(
      and(
        eq(employeeTasks.status, 'pending'),
        gt(employeeTasks.dueDate, new Date())
      )
    )
    .orderBy(employeeTasks.dueDate)
    .limit(10);
    
    return result.map(r => ({
      ...r.task,
      title: r.onboardingTask?.title,
      description: r.onboardingTask?.description,
      employee: {
        ...r.employee,
        name: `${r.employeeUser.firstName || ''} ${r.employeeUser.lastName || ''}`.trim(),
      },
      assignee: r.assignedToUser ? `${r.assignedToUser.firstName || ''} ${r.assignedToUser.lastName || ''}`.trim() : 'Unassigned',
    }));
  }
  
  async getEmployeeTasksByEmployee(employeeId: number): Promise<any[]> {
    const result = await db.select({
      task: employeeTasks,
      onboardingTask: onboardingTasks,
      assignedToUser: {
        firstName: sql<string>`assign_to_user.first_name`,
        lastName: sql<string>`assign_to_user.last_name`,
      }
    })
    .from(employeeTasks)
    .leftJoin(onboardingTasks, eq(employeeTasks.taskId, onboardingTasks.id))
    .leftJoin(users.as('assign_to_user'), eq(employeeTasks.assignedTo, sql`assign_to_user.id`))
    .where(eq(employeeTasks.employeeId, employeeId))
    .orderBy(employeeTasks.dueDate);
    
    return result.map(r => ({
      ...r.task,
      title: r.onboardingTask?.title,
      description: r.onboardingTask?.description,
      assignee: r.assignedToUser ? `${r.assignedToUser.firstName || ''} ${r.assignedToUser.lastName || ''}`.trim() : 'Unassigned',
    }));
  }
  
  async createEmployeeTask(taskData: InsertEmployeeTask): Promise<EmployeeTask> {
    const [task] = await db.insert(employeeTasks).values(taskData).returning();
    return task;
  }
  
  async completeEmployeeTask(id: number): Promise<EmployeeTask> {
    const [task] = await db
      .update(employeeTasks)
      .set({ 
        status: 'completed',
        completedAt: new Date() 
      })
      .where(eq(employeeTasks.id, id))
      .returning();
    return task;
  }
  
  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }
  
  async getAuditLogs(): Promise<AuditLog[]> {
    const result = await db.select({
      log: auditLogs,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.timestamp));
    
    return result.map(r => ({
      ...r.log,
      user: r.user.firstName && r.user.lastName ? `${r.user.firstName} ${r.user.lastName}` : 'System',
    }));
  }
  
  async getRecentAuditLogs(): Promise<AuditLog[]> {
    const result = await db.select({
      log: auditLogs,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.timestamp))
    .limit(20);
    
    return result.map(r => ({
      ...r.log,
      user: r.user.firstName && r.user.lastName ? `${r.user.firstName} ${r.user.lastName}` : 'System',
    }));
  }
  
  // Dashboard statistics
  async getDashboardStats(): Promise<any> {
    // Get active onboarding count
    const [onboardingCount] = await db.select({
      count: sql<number>`COUNT(*)`,
    })
    .from(employees)
    .where(eq(employees.isOnboarding, true));
    
    // Get training completion percentage
    const [trainingStats] = await db.select({
      completed: sql<number>`COUNT(CASE WHEN ${trainingAssignments.completedAt} IS NOT NULL THEN 1 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(trainingAssignments);
    
    const trainingCompletion = trainingStats.total > 0 
      ? Math.round((trainingStats.completed / trainingStats.total) * 100) 
      : 0;
    
    // Get open tasks count
    const [openTasksCount] = await db.select({
      count: sql<number>`COUNT(*)`,
    })
    .from(employeeTasks)
    .where(eq(employeeTasks.status, 'pending'));
    
    // Get compliance score
    const [complianceScore] = await db.select({
      score: sql<number>`COALESCE(
        (SUM(CASE WHEN ${employeeTasks.status} = 'completed' AND ${onboardingTasks.isRequired} = true THEN 1 ELSE 0 END) * 100.0) /
        NULLIF(SUM(CASE WHEN ${onboardingTasks.isRequired} = true THEN 1 ELSE 0 END), 0),
        100
      )`,
    })
    .from(employeeTasks)
    .leftJoin(onboardingTasks, eq(employeeTasks.taskId, onboardingTasks.id));
    
    return {
      activeOnboarding: onboardingCount.count,
      trainingCompletion: trainingCompletion,
      openTasks: openTasksCount.count,
      complianceScore: Math.round(complianceScore.score),
    };
  }
}

export const storage = new DatabaseStorage();
