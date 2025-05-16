import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { 
  insertDepartmentSchema, 
  insertEmployeeSchema, 
  insertTrainingModuleSchema, 
  insertOnboardingTaskSchema,
  insertEmployeeTaskSchema,
  insertTrainingAssignmentSchema,
  insertAuditLogSchema
} from "@shared/schema";

// Helper function to extract request ID for audit logging
function getRequestInfo(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || "",
  };
}

// Function to log audit events
async function logAudit(req: Request, action: string, resource: string, resourceId: string | null = null, details: any = {}, status: string = "success") {
  if (!req.user) return;
  
  const userId = req.user.claims.sub;
  const requestInfo = getRequestInfo(req);
  
  await storage.createAuditLog({
    userId,
    action,
    resource,
    resourceId: resourceId || undefined,
    details,
    status,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent,
  });
}

// Auth middleware to check if user is an admin
function isAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
}

// Auth middleware to check if user is an admin or manager
function isAdminOrManager(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user has admin or manager role
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden: Admin or Manager access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Department routes
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      
      await logAudit(req, "Created", "Department", String(department.id), department);
      
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(400).json({ message: "Invalid department data" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/onboarding", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getOnboardingEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching onboarding employees:", error);
      res.status(500).json({ message: "Failed to fetch onboarding employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      await logAudit(req, "Created", "Employee", String(employee.id), employee);
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  // Training module routes
  app.get("/api/training-modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getAllTrainingModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching training modules:", error);
      res.status(500).json({ message: "Failed to fetch training modules" });
    }
  });

  app.get("/api/training-modules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getTrainingModule(id);
      
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }
      
      res.json(module);
    } catch (error) {
      console.error("Error fetching training module:", error);
      res.status(500).json({ message: "Failed to fetch training module" });
    }
  });

  app.post("/api/training-modules", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertTrainingModuleSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      
      const module = await storage.createTrainingModule(validatedData);
      
      await logAudit(req, "Created", "TrainingModule", String(module.id), module);
      
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating training module:", error);
      res.status(400).json({ message: "Invalid training module data" });
    }
  });

  // Training assignment routes
  app.get("/api/training-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getAllTrainingAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching training assignments:", error);
      res.status(500).json({ message: "Failed to fetch training assignments" });
    }
  });

  app.get("/api/training-assignments/employee/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const assignments = await storage.getTrainingAssignmentsByEmployee(employeeId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching employee training assignments:", error);
      res.status(500).json({ message: "Failed to fetch employee training assignments" });
    }
  });

  app.get("/api/training-assignments/module/:moduleId", isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const assignments = await storage.getTrainingAssignmentsByModule(moduleId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching module training assignments:", error);
      res.status(500).json({ message: "Failed to fetch module training assignments" });
    }
  });

  app.post("/api/training-assignments", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertTrainingAssignmentSchema.parse({
        ...req.body,
        assignedBy: req.user.claims.sub
      });
      
      const assignment = await storage.createTrainingAssignment(validatedData);
      
      await logAudit(req, "Created", "TrainingAssignment", String(assignment.id), assignment);
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating training assignment:", error);
      res.status(400).json({ message: "Invalid training assignment data" });
    }
  });

  app.patch("/api/training-assignments/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { progress } = z.object({ progress: z.number().min(0).max(100) }).parse(req.body);
      
      const assignment = await storage.updateTrainingProgress(id, progress);
      
      if (progress === 100) {
        await storage.completeTrainingAssignment(id);
      }
      
      await logAudit(req, "Updated", "TrainingAssignment", String(id), { progress });
      
      res.json(assignment);
    } catch (error) {
      console.error("Error updating training progress:", error);
      res.status(400).json({ message: "Invalid progress data" });
    }
  });

  // Onboarding task routes
  app.get("/api/onboarding-tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getAllOnboardingTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching onboarding tasks:", error);
      res.status(500).json({ message: "Failed to fetch onboarding tasks" });
    }
  });

  app.post("/api/onboarding-tasks", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertOnboardingTaskSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      
      const task = await storage.createOnboardingTask(validatedData);
      
      await logAudit(req, "Created", "OnboardingTask", String(task.id), task);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating onboarding task:", error);
      res.status(400).json({ message: "Invalid onboarding task data" });
    }
  });

  // Employee task routes
  app.get("/api/employee-tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getAllEmployeeTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      res.status(500).json({ message: "Failed to fetch employee tasks" });
    }
  });

  app.get("/api/employee-tasks/upcoming", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getUpcomingTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  app.get("/api/employee-tasks/employee/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const tasks = await storage.getEmployeeTasksByEmployee(employeeId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      res.status(500).json({ message: "Failed to fetch employee tasks" });
    }
  });

  app.post("/api/employee-tasks", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertEmployeeTaskSchema.parse({
        ...req.body,
        assignedBy: req.user.claims.sub
      });
      
      const task = await storage.createEmployeeTask(validatedData);
      
      await logAudit(req, "Created", "EmployeeTask", String(task.id), task);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating employee task:", error);
      res.status(400).json({ message: "Invalid employee task data" });
    }
  });

  app.patch("/api/employee-tasks/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.completeEmployeeTask(id);
      
      await logAudit(req, "Completed", "EmployeeTask", String(id), task);
      
      res.json(task);
    } catch (error) {
      console.error("Error completing employee task:", error);
      res.status(400).json({ message: "Failed to complete employee task" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/recent", isAuthenticated, isAdminOrManager, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recent audit logs:", error);
      res.status(500).json({ message: "Failed to fetch recent audit logs" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
