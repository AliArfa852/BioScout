import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  serial,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("employee").notNull(), // 'admin', 'manager', 'employee'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  departmentId: integer("department_id").references(() => departments.id),
  position: varchar("position"),
  startDate: timestamp("start_date").notNull(),
  isOnboarding: boolean("is_onboarding").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  userId: true,
  departmentId: true,
  position: true,
  startDate: true,
  isOnboarding: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Training Modules
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).pick({
  title: true,
  description: true,
  content: true,
  createdBy: true,
});

export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;

// Employee Training Assignments
export const trainingAssignments = pgTable("training_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").references(() => trainingModules.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  progress: real("progress").default(0), // 0-100 percentage
});

export const insertTrainingAssignmentSchema = createInsertSchema(trainingAssignments).pick({
  employeeId: true,
  moduleId: true,
  assignedBy: true,
  dueDate: true,
});

export type InsertTrainingAssignment = z.infer<typeof insertTrainingAssignmentSchema>;
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;

// Onboarding Tasks
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  isRequired: boolean("is_required").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).pick({
  title: true,
  description: true,
  departmentId: true,
  isRequired: true,
  createdBy: true,
});

export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;

// Employee Onboarding Task Assignments
export const employeeTasks = pgTable("employee_tasks", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => onboardingTasks.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status").default("pending"), // 'pending', 'in_progress', 'completed'
  completedAt: timestamp("completed_at"),
});

export const insertEmployeeTaskSchema = createInsertSchema(employeeTasks).pick({
  employeeId: true,
  taskId: true,
  assignedBy: true,
  assignedTo: true,
  dueDate: true,
  priority: true,
  status: true,
});

export type InsertEmployeeTask = z.infer<typeof insertEmployeeTaskSchema>;
export type EmployeeTask = typeof employeeTasks.$inferSelect;

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  resource: varchar("resource").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  status: varchar("status").default("success"), // 'success', 'failed'
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  details: true,
  status: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
