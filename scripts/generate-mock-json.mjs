import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'data', 'mock');
mkdirSync(outDir, { recursive: true });

const TS = '2026-01-15T10:00:00.000Z';
const ORG = '11111111-1111-4111-8111-111111111111';

const skills = [
  { id: 's1', name: 'TypeScript', category: 'technical' },
  { id: 's2', name: 'React', category: 'technical' },
  { id: 's3', name: 'System Design', category: 'technical' },
  { id: 's4', name: 'API Design', category: 'technical' },
  { id: 's5', name: 'PostgreSQL', category: 'technical' },
  { id: 's6', name: 'Team Leadership', category: 'leadership' },
  { id: 's7', name: 'Coaching', category: 'leadership' },
  { id: 's8', name: 'Product Strategy', category: 'domain' },
  { id: 's9', name: 'Data Analysis', category: 'technical' },
  { id: 's10', name: 'Communication', category: 'leadership' },
  { id: 's11', name: 'Cloud Architecture', category: 'technical' },
  { id: 's12', name: 'Agile Delivery', category: 'domain' },
  { id: 's13', name: 'UX Collaboration', category: 'domain' },
  { id: 's14', name: 'Security Fundamentals', category: 'technical' },
  { id: 's15', name: 'Mentorship', category: 'leadership' },
  { id: 's16', name: 'Stakeholder Management', category: 'leadership' },
  { id: 's17', name: 'Python', category: 'technical' },
  { id: 's18', name: 'CI/CD', category: 'technical' },
  { id: 's19', name: 'Workforce Analytics', category: 'domain' },
  { id: 's20', name: 'Change Management', category: 'domain' },
].map((s, i) => ({
  id: `40000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  organizationId: ORG,
  name: s.name,
  category: s.category,
  description: `${s.name} competency for engineering and product teams`,
  isActive: true,
  createdAt: TS,
  updatedAt: TS,
}));

const roles = [
  { id: '44444444-4444-4444-8444-444444444441', title: 'Senior Software Engineer', level: 'IC3', department: 'Engineering' },
  { id: '44444444-4444-4444-8444-444444444442', title: 'Staff Software Engineer', level: 'IC4', department: 'Engineering' },
  { id: '44444444-4444-4444-8444-444444444443', title: 'Engineering Manager', level: 'M1', department: 'Engineering' },
  { id: '44444444-4444-4444-8444-444444444444', title: 'Product Engineer', level: 'IC3', department: 'Product Engineering' },
  { id: '44444444-4444-4444-8444-444444444445', title: 'Tech Lead', level: 'IC4', department: 'Engineering' },
  { id: '44444444-4444-4444-8444-444444444446', title: 'HR Business Partner', level: 'HR2', department: 'People' },
].map((r) => ({ ...r, organizationId: ORG, description: null, isActive: true, createdAt: TS, updatedAt: TS }));

const users = [
  { id: '22222222-2222-4222-8222-222222222221', email: 'alex.chen@techforward.io', fullName: 'Alex Chen', roles: ['employee'] },
  { id: '22222222-2222-4222-8222-222222222222', email: 'jordan.lee@techforward.io', fullName: 'Jordan Lee', roles: ['employee', 'manager'] },
  { id: '22222222-2222-4222-8222-222222222223', email: 'sam.patel@techforward.io', fullName: 'Sam Patel', roles: ['hr_admin'] },
  { id: '22222222-2222-4222-8222-222222222224', email: 'morgan.kim@techforward.io', fullName: 'Morgan Kim', roles: ['employee', 'manager'] },
  { id: '22222222-2222-4222-8222-222222222225', email: 'riley.nguyen@techforward.io', fullName: 'Riley Nguyen', roles: ['org_admin'] },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `22222222-2222-4222-8222-${String(230 + i).padStart(12, '0')}`,
    email: `engineer${i + 1}@techforward.io`,
    fullName: `Engineer ${i + 1}`,
    roles: ['employee'],
  })),
].map((u) => ({
  ...u,
  organizationId: ORG,
  authUserId: null,
  avatarUrl: null,
  isActive: true,
  createdAt: TS,
  updatedAt: TS,
}));

const teams = [
  {
    id: '21111111-1111-4111-8111-111111111111',
    name: 'Platform Engineering',
    department: 'Engineering',
    managerEmployeeId: '33333333-3333-4333-8333-333333333332',
  },
  {
    id: '21111111-1111-4111-8111-111111111112',
    name: 'Product Engineering',
    department: 'Product',
    managerEmployeeId: '33333333-3333-4333-8333-333333333334',
  },
].map((t) => ({ ...t, organizationId: ORG, createdAt: TS, updatedAt: TS }));

const employeeDefs = [
  { id: '33333333-3333-4333-8333-333333333331', userId: users[0].id, teamId: teams[0].id, managerId: '33333333-3333-4333-8333-333333333332', jobTitle: 'Senior Software Engineer', currentRoleId: roles[0].id },
  { id: '33333333-3333-4333-8333-333333333332', userId: users[1].id, teamId: teams[0].id, managerId: null, jobTitle: 'Engineering Manager', currentRoleId: roles[2].id },
  { id: '33333333-3333-4333-8333-333333333333', userId: users[2].id, teamId: null, managerId: null, jobTitle: 'HR Business Partner', currentRoleId: roles[5].id },
  { id: '33333333-3333-4333-8333-333333333334', userId: users[3].id, teamId: teams[1].id, managerId: null, jobTitle: 'Engineering Manager', currentRoleId: roles[2].id },
  ...users.slice(4).map((u, i) => ({
    id: `33333333-3333-4333-8333-${String(340 + i).padStart(12, '0')}`,
    userId: u.id,
    teamId: i % 2 === 0 ? teams[0].id : teams[1].id,
    managerId: i % 2 === 0 ? '33333333-3333-4333-8333-333333333332' : '33333333-3333-4333-8333-333333333334',
    jobTitle: i % 3 === 0 ? 'Software Engineer' : 'Product Engineer',
    currentRoleId: i % 3 === 0 ? roles[0].id : roles[3].id,
  })),
].map((e) => ({
  ...e,
  organizationId: ORG,
  department: e.teamId === teams[1].id ? 'Product' : 'Engineering',
  hireDate: '2022-06-01',
  isActive: true,
  createdAt: TS,
  updatedAt: TS,
}));

let userRoleCounter = 1;
const userRoles = users.flatMap((u) =>
  (u.roles || ['employee']).map((role) => ({
    id: `77777777-7777-4777-8777-${String(userRoleCounter++).padStart(12, '0')}`,
    userId: u.id,
    role,
    grantedAt: TS,
    grantedBy: null,
  })),
);

const managers = [
  { id: '88888888-8888-4888-8888-888888888881', employeeId: '33333333-3333-4333-8333-333333333332', teamId: teams[0].id },
  { id: '88888888-8888-4888-8888-888888888882', employeeId: '33333333-3333-4333-8333-333333333334', teamId: teams[1].id },
].map((m) => ({ ...m, createdAt: TS }));

const employeeProfiles = employeeDefs.map((e, i) => ({
  id: `99999999-9999-4999-8999-9999999999${String(i).padStart(2, '0')}`,
  employeeId: e.id,
  bio: null,
  careerSummary: e.id === employeeDefs[0].id ? 'Full-stack engineer focused on platform reliability and developer experience.' : null,
  onboardingCompletedAt: TS,
  inferredSkillsVisible: true,
  preferences: e.id === employeeDefs[0].id ? { growthFocus: 'technical_leadership', mobilityInterest: 'internal' } : {},
  createdAt: TS,
  updatedAt: TS,
}));

const employeeSkills = [
  { employeeId: employeeDefs[0].id, skillId: skills[0].id, source: 'confirmed', proficiencyLevel: 4, confidence: null },
  { employeeId: employeeDefs[0].id, skillId: skills[1].id, source: 'confirmed', proficiencyLevel: 4, confidence: null },
  { employeeId: employeeDefs[0].id, skillId: skills[2].id, source: 'inferred', proficiencyLevel: 3, confidence: 0.72 },
  { employeeId: employeeDefs[0].id, skillId: skills[3].id, source: 'confirmed', proficiencyLevel: 3, confidence: null },
  { employeeId: employeeDefs[0].id, skillId: skills[4].id, source: 'inferred', proficiencyLevel: 3, confidence: 0.68 },
].map((es, i) => ({
  id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa${String(i).padStart(2, '0')}`,
  ...es,
  evidenceSummary: es.source === 'inferred' ? 'Inferred from project contributions and peer feedback' : 'Self-assessed and manager confirmed',
  confirmedAt: es.source === 'confirmed' ? TS : null,
  confirmedBy: es.source === 'confirmed' ? users[1].id : null,
  createdAt: TS,
  updatedAt: TS,
}));

const roleSkills = [
  { roleId: roles[1].id, skillId: skills[2].id, importance: 'required', minProficiency: 4 },
  { roleId: roles[1].id, skillId: skills[0].id, importance: 'required', minProficiency: 4 },
  { roleId: roles[1].id, skillId: skills[11].id, importance: 'preferred', minProficiency: 3 },
].map((rs, i) => ({
  id: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb${String(i).padStart(2, '0')}`,
  ...rs,
  createdAt: TS,
}));

const careerGoals = [
  {
    id: '66666666-6666-4666-8666-666666666661',
    employeeId: employeeDefs[0].id,
    targetRoleId: roles[1].id,
    title: 'Grow into Staff Engineer',
    description: 'Build system design depth and mentor junior engineers',
    timelineMonths: 18,
    status: 'active',
    createdAt: TS,
    updatedAt: TS,
  },
];

const learningResources = [
  { title: 'Advanced System Design Patterns', format: 'course', skillIds: [skills[2].id], provider: 'Internal Academy' },
  { title: 'Staff Engineer Path Workshop', format: 'workshop', skillIds: [skills[6].id, skills[15].id], provider: 'GrowthOS Learning' },
  { title: 'TypeScript Deep Dive', format: 'course', skillIds: [skills[0].id], provider: 'TechForward U' },
  { title: 'Effective 1:1 Conversations', format: 'book', skillIds: [skills[7].id], provider: 'People Ops' },
  { title: 'PostgreSQL Performance Tuning', format: 'course', skillIds: [skills[4].id], provider: 'Platform Guild' },
  { title: 'Leading Technical Initiatives', format: 'mentorship', skillIds: [skills[6].id], provider: 'Leadership Circle' },
  { title: 'API Design Best Practices', format: 'course', skillIds: [skills[3].id], provider: 'Engineering Guild' },
  { title: 'Cloud Architecture Foundations', format: 'course', skillIds: [skills[10].id], provider: 'Cloud Guild' },
  { title: 'Agile Team Delivery', format: 'workshop', skillIds: [skills[11].id], provider: 'Delivery Office' },
  { title: 'Security for Application Teams', format: 'course', skillIds: [skills[13].id], provider: 'Security Team' },
].map((lr, i) => ({
  id: `cccccccc-cccc-4ccc-8ccc-cccccccccc${String(i).padStart(2, '0')}`,
  organizationId: ORG,
  description: lr.title,
  url: null,
  durationHours: 4 + i,
  isActive: true,
  createdAt: TS,
  ...lr,
}));

const opportunities = [
  { title: 'Platform Reliability Lead (Stretch)', roleId: roles[4].id, department: 'Engineering', status: 'open' },
  { title: 'Internal Transfer — Product Engineering', roleId: roles[3].id, department: 'Product', status: 'open' },
  { title: 'Mentorship Program — Junior Engineers', roleId: null, department: 'Engineering', status: 'open' },
  { title: 'Cross-team Architecture Initiative', roleId: roles[1].id, department: 'Engineering', status: 'open' },
  { title: 'Developer Experience Guild Chair', roleId: roles[4].id, department: 'Platform', status: 'open' },
].map((o, i) => ({
  id: `dddddddd-dddd-4ddd-8ddd-dddddddddd${String(i).padStart(2, '0')}`,
  organizationId: ORG,
  description: o.title,
  requiredSkillIds: [skills[2].id, skills[0].id],
  postedAt: TS,
  createdAt: TS,
  ...o,
}));

const growthPlans = [
  {
    id: '55555555-5555-4555-8555-555555555551',
    employeeId: employeeDefs[0].id,
    careerGoalId: careerGoals[0].id,
    targetRoleId: roles[1].id,
    title: 'Staff Engineer Growth Plan',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-05-30',
    createdAt: TS,
    updatedAt: TS,
  },
];

const growthPlanItems = [
  { title: 'Complete system design learning path', milestoneDay: 30, itemType: 'learning', learningResourceId: learningResources[0].id, status: 'in_progress' },
  { title: 'Lead design review for payments service', milestoneDay: 30, itemType: 'project', skillId: skills[2].id, status: 'pending' },
  { title: 'Mentor two junior engineers', milestoneDay: 60, itemType: 'conversation', status: 'pending' },
  { title: 'Present architecture proposal to platform guild', milestoneDay: 60, itemType: 'project', skillId: skills[2].id, status: 'pending' },
  { title: 'Shadow staff engineer on cross-team initiative', milestoneDay: 90, itemType: 'learning', learningResourceId: learningResources[1].id, status: 'pending' },
].map((item, i) => ({
  id: `eeeeeeee-eeee-4eee-8eee-eeeeeeeeee${String(i).padStart(2, '0')}`,
  growthPlanId: growthPlans[0].id,
  description: item.title,
  dueDate: null,
  sortOrder: i,
  createdAt: TS,
  updatedAt: TS,
  ...item,
}));

const recommendations = [
  {
    id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
    employeeId: employeeDefs[0].id,
    agentId: 'employee-growth',
    type: 'career_path',
    title: 'Staff Engineer is a strong near-term path',
    explanation:
      'Your confirmed TypeScript and API design skills, plus growing system design capability, align with the Staff Engineer role requirements at TechForward.',
    confidence: 0.82,
    confidenceLevel: 'high',
    status: 'pending',
  },
  {
    id: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
    employeeId: employeeDefs[0].id,
    agentId: 'dynamic-learning',
    type: 'learning',
    title: 'Prioritize system design coursework',
    explanation:
      'Closing the system design gap will strengthen your Staff Engineer candidacy. This is based on role requirements, not performance judgment.',
    confidence: 0.78,
    confidenceLevel: 'medium',
    status: 'pending',
  },
  {
    id: 'ffffffff-ffff-4fff-8fff-fffffffffff3',
    employeeId: employeeDefs[0].id,
    agentId: 'internal-mobility',
    type: 'mobility',
    title: 'Platform Reliability Lead stretch assignment',
    explanation:
      'This open internal opportunity matches your platform experience and offers visibility for technical leadership growth.',
    confidence: 0.71,
    confidenceLevel: 'medium',
    status: 'pending',
  },
].map((r) => ({
  ...r,
  organizationId: ORG,
  metadata: {},
  createdAt: TS,
  updatedAt: TS,
}));

const recommendationEvidence = [
  { recommendationId: recommendations[0].id, evidenceType: 'skill', referenceId: skills[0].id, label: 'TypeScript (confirmed)', detail: 'Proficiency level 4' },
  { recommendationId: recommendations[0].id, evidenceType: 'role_requirement', referenceId: roles[1].id, label: 'Staff Engineer role requirements', detail: 'System design required at proficiency 4' },
  { recommendationId: recommendations[1].id, evidenceType: 'learning_resource', referenceId: learningResources[0].id, label: 'Advanced System Design Patterns', detail: 'Recommended learning resource' },
  { recommendationId: recommendations[2].id, evidenceType: 'opportunity', referenceId: opportunities[0].id, label: 'Platform Reliability Lead', detail: 'Open internal opportunity' },
].map((e, i) => ({
  id: `10101010-1010-4101-8101-1010101010${String(i).padStart(2, '0')}`,
  ...e,
  createdAt: TS,
}));

const dataReadiness = [
  {
    id: '12121212-1212-4121-8121-121212121201',
    organizationId: ORG,
    scopeType: 'organization',
    scopeId: null,
    overallScore: 74,
    confirmedSkillsPct: 58,
    profileCompletenessPct: 81,
    roleMappingPct: 72,
    activePlansPct: 42,
    calculatedAt: TS,
    createdAt: TS,
  },
  {
    id: '12121212-1212-4121-8121-121212121202',
    organizationId: ORG,
    scopeType: 'department',
    scopeId: teams[0].id,
    overallScore: 78,
    confirmedSkillsPct: 62,
    profileCompletenessPct: 85,
    roleMappingPct: 76,
    activePlansPct: 48,
    calculatedAt: TS,
    createdAt: TS,
  },
];

const files = {
  'organization.json': [{ id: ORG, name: 'TechForward Inc.', slug: 'techforward', settings: {}, createdAt: TS, updatedAt: TS }],
  'users.json': users,
  'user-roles.json': userRoles,
  'employees.json': employeeDefs,
  'employee-profiles.json': employeeProfiles,
  'managers.json': managers,
  'teams.json': teams,
  'skills.json': skills,
  'employee-skills.json': employeeSkills,
  'roles.json': roles,
  'role-skills.json': roleSkills,
  'career-goals.json': careerGoals,
  'learning-resources.json': learningResources,
  'opportunities.json': opportunities,
  'growth-plans.json': growthPlans,
  'growth-plan-items.json': growthPlanItems,
  'recommendations.json': recommendations,
  'recommendation-evidence.json': recommendationEvidence,
  'data-readiness.json': dataReadiness,
  'agent-conversations.json': [],
  'agent-messages.json': [],
  'audit-logs.json': [],
  'permissions.json': [],
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2));
  console.log('wrote', name);
}
