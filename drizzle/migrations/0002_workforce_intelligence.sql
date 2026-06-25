CREATE TYPE "public"."decision_type" AS ENUM('team_composition', 'skill_development', 'work_redesign', 'project_assignment', 'capability_building', 'learning_investment', 'internal_mobility_exploration', 'coaching_intervention');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('draft', 'proposed', 'under_review', 'approved', 'implemented', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."scenario_type" AS ENUM('current_state', 'future_state', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."scenario_status" AS ENUM('draft', 'active', 'archived', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role_task_change_type" AS ENUM('add', 'remove', 'increase', 'decrease', 'automate', 'delegate');--> statement-breakpoint
CREATE TYPE "public"."outcome_status" AS ENUM('pending', 'on_track', 'achieved', 'partially_achieved', 'missed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."context_entity_type" AS ENUM('employee', 'skill', 'role', 'team', 'project', 'business_priority', 'learning_resource', 'opportunity');--> statement-breakpoint
CREATE TYPE "public"."context_relationship_type" AS ENUM('has_skill', 'requires_skill', 'works_on', 'supports', 'member_of', 'reports_to', 'aligned_with', 'at_risk_for', 'interested_in', 'depends_on');--> statement-breakpoint
CREATE TYPE "public"."proposed_action_type" AS ENUM('skill_development', 'learning_assignment', 'stretch_assignment', 'coaching_prompt', 'growth_plan_item', 'team_capability_action', 'mobility_exploration', 'work_redesign_suggestion', 'conversation_prep');--> statement-breakpoint
CREATE TYPE "public"."proposed_action_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'applied', 'dismissed');--> statement-breakpoint
CREATE TABLE "business_priorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quarter" text,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_employee_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_priority_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" text,
	"allocation_pct" real,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workforce_context_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_entity_type" "context_entity_type" NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_type" "context_entity_type" NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relationship_type" "context_relationship_type" NOT NULL,
	"strength" real,
	"label" text,
	"explanation" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workforce_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"decision_type" "decision_type" NOT NULL,
	"status" "decision_status" DEFAULT 'draft' NOT NULL,
	"team_id" uuid,
	"business_priority_id" uuid,
	"owner_employee_id" uuid,
	"rationale" text,
	"confidence" real,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"reference_id" uuid,
	"label" text NOT NULL,
	"detail" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"outcome_type" text NOT NULL,
	"description" text NOT NULL,
	"status" "outcome_status" DEFAULT 'pending' NOT NULL,
	"metric_label" text,
	"metric_value" real,
	"target_value" real,
	"recorded_at" timestamp with time zone,
	"recorded_by_employee_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" text DEFAULT 'contributor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"team_id" uuid NOT NULL,
	"scenario_type" "scenario_type" NOT NULL,
	"status" "scenario_status" DEFAULT 'draft' NOT NULL,
	"business_priority_id" uuid,
	"rationale" text,
	"confidence" real,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_scenario_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"headcount" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_scenario_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"demand_level" integer NOT NULL,
	"supply_level" integer NOT NULL,
	"gap" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_evolution_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"current_role_id" uuid NOT NULL,
	"future_role_id" uuid,
	"future_role_title" text,
	"status" "scenario_status" DEFAULT 'draft' NOT NULL,
	"rationale" text,
	"confidence" real,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_task_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"role_evolution_scenario_id" uuid NOT NULL,
	"task_description" text NOT NULL,
	"change_type" "role_task_change_type" NOT NULL,
	"impact_level" text DEFAULT 'medium' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_action_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" text NOT NULL,
	"employee_id" uuid,
	"team_id" uuid,
	"title" text NOT NULL,
	"summary" text,
	"source_decision_id" uuid,
	"governance_status" "governance_status" DEFAULT 'passed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_proposed_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"action_plan_id" uuid NOT NULL,
	"action_type" "proposed_action_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "proposed_action_status" DEFAULT 'draft' NOT NULL,
	"target_employee_id" uuid,
	"reference_id" uuid,
	"confidence" real,
	"explanation" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_priorities" ADD CONSTRAINT "business_priorities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_priorities" ADD CONSTRAINT "business_priorities_owner_employee_id_employees_id_fk" FOREIGN KEY ("owner_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_priority_id_business_priorities_id_fk" FOREIGN KEY ("business_priority_id") REFERENCES "public"."business_priorities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_context_edges" ADD CONSTRAINT "workforce_context_edges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_decisions" ADD CONSTRAINT "workforce_decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_decisions" ADD CONSTRAINT "workforce_decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_decisions" ADD CONSTRAINT "workforce_decisions_business_priority_id_business_priorities_id_fk" FOREIGN KEY ("business_priority_id") REFERENCES "public"."business_priorities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workforce_decisions" ADD CONSTRAINT "workforce_decisions_owner_employee_id_employees_id_fk" FOREIGN KEY ("owner_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_evidence" ADD CONSTRAINT "decision_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_evidence" ADD CONSTRAINT "decision_evidence_decision_id_workforce_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."workforce_decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_outcomes" ADD CONSTRAINT "decision_outcomes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_outcomes" ADD CONSTRAINT "decision_outcomes_decision_id_workforce_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."workforce_decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_outcomes" ADD CONSTRAINT "decision_outcomes_recorded_by_employee_id_employees_id_fk" FOREIGN KEY ("recorded_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_participants" ADD CONSTRAINT "decision_participants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_participants" ADD CONSTRAINT "decision_participants_decision_id_workforce_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."workforce_decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_participants" ADD CONSTRAINT "decision_participants_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenarios" ADD CONSTRAINT "team_scenarios_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenarios" ADD CONSTRAINT "team_scenarios_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenarios" ADD CONSTRAINT "team_scenarios_business_priority_id_business_priorities_id_fk" FOREIGN KEY ("business_priority_id") REFERENCES "public"."business_priorities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenario_roles" ADD CONSTRAINT "team_scenario_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenario_roles" ADD CONSTRAINT "team_scenario_roles_scenario_id_team_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."team_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenario_roles" ADD CONSTRAINT "team_scenario_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenario_skills" ADD CONSTRAINT "team_scenario_skills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_scenario_skills" ADD CONSTRAINT "team_scenario_skills_scenario_id_team_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."team_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_evolution_scenarios" ADD CONSTRAINT "role_evolution_scenarios_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_evolution_scenarios" ADD CONSTRAINT "role_evolution_scenarios_current_role_id_roles_id_fk" FOREIGN KEY ("current_role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_evolution_scenarios" ADD CONSTRAINT "role_evolution_scenarios_future_role_id_roles_id_fk" FOREIGN KEY ("future_role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_task_changes" ADD CONSTRAINT "role_task_changes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_task_changes" ADD CONSTRAINT "role_task_changes_role_evolution_scenario_id_role_evolution_scenarios_id_fk" FOREIGN KEY ("role_evolution_scenario_id") REFERENCES "public"."role_evolution_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_plans" ADD CONSTRAINT "agent_action_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_plans" ADD CONSTRAINT "agent_action_plans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_plans" ADD CONSTRAINT "agent_action_plans_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action_plans" ADD CONSTRAINT "agent_action_plans_source_decision_id_workforce_decisions_id_fk" FOREIGN KEY ("source_decision_id") REFERENCES "public"."workforce_decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_proposed_actions" ADD CONSTRAINT "agent_proposed_actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_proposed_actions" ADD CONSTRAINT "agent_proposed_actions_action_plan_id_agent_action_plans_id_fk" FOREIGN KEY ("action_plan_id") REFERENCES "public"."agent_action_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_proposed_actions" ADD CONSTRAINT "agent_proposed_actions_target_employee_id_employees_id_fk" FOREIGN KEY ("target_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_priorities_organization_id_idx" ON "business_priorities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "business_priorities_owner_employee_id_idx" ON "business_priorities" USING btree ("owner_employee_id");--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_business_priority_id_idx" ON "projects" USING btree ("business_priority_id");--> statement-breakpoint
CREATE INDEX "project_memberships_organization_id_idx" ON "project_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_memberships_project_id_idx" ON "project_memberships" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_memberships_employee_id_idx" ON "project_memberships" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "workforce_context_edges_organization_id_idx" ON "workforce_context_edges" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workforce_context_edges_source_idx" ON "workforce_context_edges" USING btree ("source_entity_type","source_entity_id");--> statement-breakpoint
CREATE INDEX "workforce_context_edges_target_idx" ON "workforce_context_edges" USING btree ("target_entity_type","target_entity_id");--> statement-breakpoint
CREATE INDEX "workforce_decisions_organization_id_idx" ON "workforce_decisions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workforce_decisions_team_id_idx" ON "workforce_decisions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "workforce_decisions_status_idx" ON "workforce_decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "decision_evidence_organization_id_idx" ON "decision_evidence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decision_evidence_decision_id_idx" ON "decision_evidence" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "decision_outcomes_organization_id_idx" ON "decision_outcomes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decision_outcomes_decision_id_idx" ON "decision_outcomes" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "decision_participants_organization_id_idx" ON "decision_participants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "decision_participants_decision_id_idx" ON "decision_participants" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "team_scenarios_organization_id_idx" ON "team_scenarios" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_scenarios_team_id_idx" ON "team_scenarios" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_scenario_roles_organization_id_idx" ON "team_scenario_roles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_scenario_roles_scenario_id_idx" ON "team_scenario_roles" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "team_scenario_skills_organization_id_idx" ON "team_scenario_skills" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_scenario_skills_scenario_id_idx" ON "team_scenario_skills" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "role_evolution_scenarios_organization_id_idx" ON "role_evolution_scenarios" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "role_task_changes_organization_id_idx" ON "role_task_changes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "role_task_changes_scenario_id_idx" ON "role_task_changes" USING btree ("role_evolution_scenario_id");--> statement-breakpoint
CREATE INDEX "agent_action_plans_organization_id_idx" ON "agent_action_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_action_plans_employee_id_idx" ON "agent_action_plans" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "agent_proposed_actions_organization_id_idx" ON "agent_proposed_actions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_proposed_actions_action_plan_id_idx" ON "agent_proposed_actions" USING btree ("action_plan_id");
