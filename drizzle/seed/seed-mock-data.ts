/**
 * Port mock JSON fixtures into Postgres (IMPLEMENTATION_PLAN 8.10).
 * Run: DATABASE_URL=... npx tsx drizzle/seed/seed-mock-data.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../../src/lib/db/schema';

const root = resolve(process.cwd(), 'data/mock');

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(root, file), 'utf8')) as T;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: 'User' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

type MockUser = {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  authUserId?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: string[];
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to seed the database.');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  const organizations = readJson<typeof schema.organizations.$inferInsert[]>('organization.json');
  const users = readJson<MockUser[]>('users.json');
  const employees = readJson<
    Array<{
      id: string;
      organizationId: string;
      userId: string;
      teamId?: string | null;
      managerId?: string | null;
      jobTitle: string;
      department?: string | null;
      hireDate?: string | null;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>
  >('employees.json');

  await db.insert(schema.organizations).values(organizations).onConflictDoNothing();
  await db
    .insert(schema.users)
    .values(
      users.map((user) => ({
        id: user.id,
        organizationId: user.organizationId,
        authUserId: user.authUserId ?? null,
        email: user.email,
        displayName: user.fullName,
        avatarUrl: user.avatarUrl ?? null,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
    )
    .onConflictDoNothing();

  const userRoles = users.flatMap((user) =>
    (user.roles ?? ['employee']).map((role) => ({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      userId: user.id,
      role: role as schema.userRoles.$inferInsert['role'],
      grantedAt: new Date(user.createdAt),
      createdAt: new Date(user.createdAt),
    })),
  );
  if (userRoles.length > 0) {
    await db.insert(schema.userRoles).values(userRoles).onConflictDoNothing();
  }

  await db
    .insert(schema.employees)
    .values(
      employees.map((employee) => {
        const user = users.find((u) => u.id === employee.userId);
        const names = splitName(user?.fullName ?? employee.jobTitle);
        return {
          id: employee.id,
          organizationId: employee.organizationId,
          userId: employee.userId,
          firstName: names.firstName,
          lastName: names.lastName,
          email: user?.email ?? `${employee.id}@example.com`,
          title: employee.jobTitle,
          department: employee.department ?? null,
          hireDate: employee.hireDate ? new Date(employee.hireDate) : null,
          managerId: employee.managerId ?? null,
          teamId: employee.teamId ?? null,
          isActive: employee.isActive,
          createdAt: new Date(employee.createdAt),
          updatedAt: new Date(employee.updatedAt),
        };
      }),
    )
    .onConflictDoNothing();

  const profiles = readJson<
    Array<{
      id: string;
      employeeId: string;
      bio: string | null;
      careerSummary?: string | null;
      onboardingCompletedAt?: string | null;
      inferredSkillsVisible?: boolean;
      preferences?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>
  >('employee-profiles.json');

  await db
    .insert(schema.employeeProfiles)
    .values(
      profiles.map((profile) => ({
        id: profile.id,
        organizationId: employees.find((e) => e.id === profile.employeeId)?.organizationId ?? organizations[0].id,
        employeeId: profile.employeeId,
        bio: profile.bio,
        metadata: {
          careerSummary: profile.careerSummary ?? null,
          onboardingCompletedAt: profile.onboardingCompletedAt ?? null,
          inferredSkillsVisible: profile.inferredSkillsVisible ?? true,
          preferences: profile.preferences ?? {},
        },
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      })),
    )
    .onConflictDoNothing();

  const orgId = organizations[0]?.id ?? '11111111-1111-4111-8111-111111111111';

  await db.insert(schema.teams).values(readJson('teams.json')).onConflictDoNothing();
  await db.insert(schema.skills).values(readJson('skills.json')).onConflictDoNothing();

  const employeeSkills = readJson<
    Array<{
      id: string;
      employeeId: string;
      skillId: string;
      source: 'confirmed' | 'inferred';
      proficiencyLevel?: number | null;
      createdAt: string;
      updatedAt: string;
    }>
  >('employee-skills.json');
  await db
    .insert(schema.employeeSkills)
    .values(
      employeeSkills.map((row) => ({
        id: row.id,
        organizationId: orgId,
        employeeId: row.employeeId,
        skillId: row.skillId,
        source: row.source,
        proficiencyLevel: row.proficiencyLevel ?? 3,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
    )
    .onConflictDoNothing();

  await db.insert(schema.roles).values(readJson('roles.json')).onConflictDoNothing();

  const roleSkills = readJson<
    Array<{
      id: string;
      roleId: string;
      skillId: string;
      importance: 'required' | 'preferred' | 'nice_to_have';
      minProficiency?: number | null;
      createdAt: string;
    }>
  >('role-skills.json');
  await db
    .insert(schema.roleSkills)
    .values(
      roleSkills.map((row) => ({
        id: row.id,
        organizationId: orgId,
        roleId: row.roleId,
        skillId: row.skillId,
        requiredLevel: row.minProficiency ?? 3,
        importance: row.importance,
        createdAt: new Date(row.createdAt),
      })),
    )
    .onConflictDoNothing();

  await db.insert(schema.careerGoals).values(
    readJson('career-goals.json').map((row: Record<string, unknown>) => ({
      ...row,
      organizationId: orgId,
      targetDate: row.targetDate ? new Date(String(row.targetDate)) : null,
      createdAt: new Date(String(row.createdAt)),
      updatedAt: new Date(String(row.updatedAt)),
    })),
  ).onConflictDoNothing();

  const learningResources = readJson<
    Array<{
      id: string;
      organizationId: string;
      title: string;
      description?: string | null;
      format: string;
      url?: string | null;
      skillIds?: string[];
      durationHours?: number | null;
      provider?: string | null;
      isActive: boolean;
      createdAt: string;
    }>
  >('learning-resources.json');
  await db
    .insert(schema.learningResources)
    .values(
      learningResources.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        title: row.title,
        description: row.description ?? null,
        format: row.format as schema.learningResources.$inferInsert['format'],
        url: row.url ?? null,
        skillIds: row.skillIds ?? [],
        durationMinutes: row.durationHours ? Math.round(row.durationHours * 60) : null,
        provider: row.provider ?? null,
        isActive: row.isActive,
        createdAt: new Date(row.createdAt),
      })),
    )
    .onConflictDoNothing();

  await db.insert(schema.opportunities).values(
    readJson('opportunities.json').map((row: Record<string, unknown>) => ({
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      description: row.description,
      roleId: row.roleId,
      department: row.department,
      status: row.status,
      postedAt: new Date(String(row.postedAt)),
      createdAt: new Date(String(row.createdAt)),
      updatedAt: new Date(String(row.updatedAt ?? row.createdAt)),
    })),
  ).onConflictDoNothing();

  const growthPlans = readJson<
    Array<{
      id: string;
      employeeId: string;
      title: string;
      status: string;
      startDate: string;
      endDate?: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >('growth-plans.json');
  await db
    .insert(schema.growthPlans)
    .values(
      growthPlans.map((plan) => ({
        id: plan.id,
        organizationId: orgId,
        employeeId: plan.employeeId,
        title: plan.title,
        status: plan.status as schema.growthPlans.$inferInsert['status'],
        startDate: new Date(plan.startDate),
        targetDate: plan.endDate ? new Date(plan.endDate) : null,
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      })),
    )
    .onConflictDoNothing();

  const growthPlanItems = readJson<
    Array<{
      id: string;
      growthPlanId: string;
      title: string;
      description?: string | null;
      itemType: string;
      status: string;
      sortOrder: number;
      skillId?: string | null;
      learningResourceId?: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >('growth-plan-items.json');
  await db
    .insert(schema.growthPlanItems)
    .values(
      growthPlanItems.map((item) => ({
        id: item.id,
        organizationId: orgId,
        growthPlanId: item.growthPlanId,
        itemType: item.itemType as schema.growthPlanItems.$inferInsert['itemType'],
        title: item.title,
        description: item.description ?? null,
        status: item.status as schema.growthPlanItems.$inferInsert['status'],
        referenceId: item.learningResourceId ?? item.skillId ?? null,
        sortOrder: item.sortOrder,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
    )
    .onConflictDoNothing();

  const recommendations = readJson<
    Array<{
      id: string;
      organizationId: string;
      employeeId: string;
      agentId: string;
      type: string;
      title: string;
      explanation: string;
      confidence: number;
      confidenceLevel: 'low' | 'medium' | 'high';
      status: string;
      metadata?: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>
  >('recommendations.json');
  await db
    .insert(schema.recommendations)
    .values(
      recommendations.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        employeeId: row.employeeId,
        agentId: row.agentId,
        type: row.type as schema.recommendations.$inferInsert['type'],
        title: row.title,
        explanation: row.explanation,
        confidence: row.confidenceLevel,
        confidenceScore: row.confidence,
        status: row.status as schema.recommendations.$inferInsert['status'],
        metadata: row.metadata ?? {},
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.recommendationEvidence)
    .values(
      readJson('recommendation-evidence.json').map((row: Record<string, unknown>) => ({
        ...row,
        organizationId: orgId,
        createdAt: new Date(String(row.createdAt)),
      })),
    )
    .onConflictDoNothing();

  const readiness = readJson<
    Array<{
      id: string;
      organizationId: string;
      scopeType: string;
      scopeId: string | null;
      overallScore: number;
      confirmedSkillsPct?: number;
      profileCompletenessPct?: number;
      roleMappingPct?: number;
      activePlansPct?: number;
      calculatedAt: string;
      createdAt: string;
    }>
  >('data-readiness.json');

  await db
    .insert(schema.dataReadinessScores)
    .values(
      readiness.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        scopeType: row.scopeType as schema.dataReadinessScores.$inferInsert['scopeType'],
        scopeId: row.scopeId,
        overallScore: row.overallScore,
        dimensions: {
          confirmedSkillsPct: row.confirmedSkillsPct ?? null,
          profileCompletenessPct: row.profileCompletenessPct ?? null,
          roleMappingPct: row.roleMappingPct ?? null,
          activePlansPct: row.activePlansPct ?? null,
        },
        calculatedAt: new Date(row.calculatedAt),
        createdAt: new Date(row.createdAt),
      })),
    )
    .onConflictDoNothing();

  await sql.end();
  console.log('Seed complete: TechForward demo data loaded.');
}

void main();
